import { useEffect, useState } from 'react';
import axios from 'axios';

const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const iconStyle = { fontSize: '3rem', color: '#31A1AC' };

const iconMap = {
    regulatory_authorities: (
        <i className="bi bi-building-fill" style={iconStyle}></i>
    ),
    physicians: (
        <i className="bi bi-heart-pulse-fill" style={iconStyle}></i>
    ),
    patients: (
        <i className="bi bi-person-fill" style={iconStyle}></i>
    ),
    pharmacies: (
        <i className="bi bi-prescription2" style={iconStyle}></i>
    ),
    prescriptions: (
        <i className="bi bi-prescription" style={iconStyle}></i> 
    )
};

const RegulatoryHome = () => {
    const [counts, setCounts] = useState({
        regulatory_authorities: 0,
        physicians: 0,
        patients: 0,
        pharmacies: 0,
        prescriptions: 0 
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const responses = await Promise.all([
                    axios.get(`${apiBaseURL}entities/count/physicians`),
                    axios.get(`${apiBaseURL}entities/count/patients`),
                    axios.get(`${apiBaseURL}entities/count/pharmacies`),
                    axios.get(`${apiBaseURL}entities/count/regulatory_authorities`),
                    axios.get(`${apiBaseURL}prescriptions/count`)
                ]);

                setCounts({
                    regulatory_authorities: responses[3].data.count,
                    physicians: responses[0].data.count,
                    pharmacies: responses[2].data.count,
                    patients: responses[1].data.count,
                    prescriptions: responses[4].data.count,
                });
            } catch (error) {
                setError('Failed to fetch data. Please try again later.');
                console.error('Error fetching entity counts:', error);
            }
        };

        fetchCounts();
    }, []);

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };


    return (
        <div className="container my-3 bgcolor2">
            <h4 className="mb-4">Regulatory Authority Dashboard</h4>
            {error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4"> {/* Adjust column count if needed */}
                    {Object.keys(counts).map(key => (
                        <div className={`col ${key === 'prescriptions' ||  key === 'patients' ? 'col-lg-6' : ''}`} key={key}>
                            <div className="card text-center h-100 shadow">
                                <div className="card-body d-flex flex-column align-items-center">
                                    <div className="mb-3">
                                        {iconMap[key]}
                                    </div>
                                    <h6 className="card-title text-secondary h5">
                                        {`${key.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}`}
                                    </h6>
                                    <p className="card-text display-4 text-primary mb-0">
                                        {formatNumber(counts[key])}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RegulatoryHome;
