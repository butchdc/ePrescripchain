import { useEffect, useState } from 'react';
import axios from 'axios';

// Retrieve the API base URL from environment variables
const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

const RegulatoryHome = () => {
    const [counts, setCounts] = useState({
        physicians: 0,
        patients: 0,
        pharmacies: 0,
        regulatory_authorities: 0
    });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const responses = await Promise.all([
                    axios.get(`${apiBaseURL}entities/count/physicians`),
                    axios.get(`${apiBaseURL}entities/count/patients`),
                    axios.get(`${apiBaseURL}entities/count/pharmacies`),
                    axios.get(`${apiBaseURL}entities/count/regulatory_authorities`)
                ]);

                setCounts({
                    physicians: responses[0].data.count,
                    patients: responses[1].data.count,
                    pharmacies: responses[2].data.count,
                    regulatory_authorities: responses[3].data.count
                });
            } catch (error) {
                console.error('Error fetching entity counts:', error);
            }
        };

        fetchCounts();
    }, []);

    return (
        <div className="container bgcolor2 p-3">
            <h4 className="mb-4">Regulatory Authority Dashboard</h4>
            <div className="row gap-2">
                <div className="card bgcolor2 col-md-6 col-lg-5 p-0">
                    <h6 className="card-header bgcolor3">Registered Regulatory Authorities</h6>
                    <div className="card-body p-3 text-center rounded bg-white">
                        <div className="display-1">{counts.regulatory_authorities}</div>
                    </div>
                </div>
                <div className="card bgcolor2 col-md-6 col-lg-5 p-0">
                    <h6 className="card-header bgcolor3">Registered Physicians</h6>
                    <div className="card-body p-3 text-center rounded bg-white">
                        <div className="display-1">{counts.physicians}</div>
                    </div>
                </div>
                <div className="card bgcolor2 col-md-6 col-lg-5 p-0">
                    <h6 className="card-header bgcolor3">Registered Patients</h6>
                    <div className="card-body p-3 text-center rounded bg-white">
                        <div className="display-1">{counts.patients}</div>
                    </div>
                </div>
                <div className="card bgcolor2 col-md-6 col-lg-5 p-0">
                    <h6 className="card-header bgcolor3">Registered Pharmacies</h6>
                    <div className="card-body p-3 text-center rounded bg-white">
                        <div className="display-1">{counts.pharmacies}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default RegulatoryHome;
