import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserRole from '../hooks/useuserrole';
import { getUserRoleAndAttributes } from '../utils/userqueryutils';

const QueryPage = () => {
    const [address, setAddress] = useState('');
    const [role, setRole] = useState(null);
    const [attributes, setAttributes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { role: userRole, loading: roleLoading, error: roleError } = useUserRole();
    const navigate = useNavigate();

    useEffect(() => {
        if (roleLoading) return;
        if (roleError) {
            setError(roleError);
            return;
        }
        if (userRole !== 'Administrator' && userRole !== 'Regulatory Authority') {
            navigate('/'); // Redirect to home if user does not have access
        }
    }, [roleLoading, roleError, userRole, navigate]);

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
            console.log('Fetched Role:', role); // Log role for debugging
            console.log('Fetched Attributes:', attributes); // Log attributes for debugging
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
                            <h5>Role:</h5>
                            <p>{role}</p>
                            {attributes && Object.keys(attributes).length > 0 ? (
                                <div>
                                    <h5>Attributes:</h5>
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
