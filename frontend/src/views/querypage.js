import { useState } from 'react';
import useUserRole from '../hooks/useuserrole';
import { getUserRoleAndAttributes } from '../utils/userqueryutils';

const QueryPage = () => {
    const [address, setAddress] = useState('');
    const [role, setRole] = useState(null);
    const [attributes, setAttributes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { role: userRole, loading: roleLoading, error: roleError } = useUserRole();

    const handleChange = (e) => {
        setAddress(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setRole(null);
        setAttributes(null);

        try {
            const { role, attributes } = await getUserRoleAndAttributes(address);
            setRole(role);
            setAttributes(attributes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (roleLoading) return <p>Loading...</p>;
    if (roleError) return <p style={{ color: 'red' }}>{roleError}</p>;

    return (
        <div className='container p-3 bgcolor2'>
            <h4>Query Account Details</h4>
            {userRole === 'Administrator' || userRole === 'Regulatory Authority' ? (
                <>
                    <form onSubmit={handleSubmit}>
                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                id="address"
                                className="form-control"
                                value={address}
                                onChange={handleChange}
                                placeholder="Account Address"
                                required
                                autoComplete='off'
                            />
                            <label htmlFor="address">Account Address</label>
                        </div>
                        <button className="btn btn-sm btn-success" type="submit" disabled={loading}>
                            {loading ? 'Fetching...' : 'Fetch Details'}
                        </button>
                    </form>

                    {error && <p className="text-danger mt-3">{error}</p>}
                    {role && (
                        <div className="mt-3">
                            {attributes && Object.keys(attributes).length > 0 ? (
                                <div>
                                    <h5>Details</h5>
                                    <table className="table table-sm table-striped">
                                        <thead className='table-info'>
                                            <tr>
                                                <th>Attribute</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(attributes).map(([key, value]) => (
                                                <tr key={key}>
                                                    <td>{key}</td>
                                                    <td>{value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No attributes available.</p>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <p>You do not have the required permissions to access this page.</p>
            )}
        </div>
    );
};

export default QueryPage;
