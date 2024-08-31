import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ role }) => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bgcolor1 ps-3 pe-3 m-0">
            <Link className="navbar-brand" to="/">e-Prescription DApp</Link>
            <button 
                className="navbar-toggler" 
                type="button" 
                data-toggle="collapse" 
                data-target="#navbarSupportedContent" 
                aria-controls="navbarSupportedContent" 
                aria-expanded="false" 
                aria-label="Toggle navigation"
            >
                <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse hstack" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto col">
                    {role === 'Administrator' && (
                        <>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-regulatory-authority">Register Regulatory Authority</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/query-page">Account Query</Link>
                            </li>
                        </>
                    )}
                    {role === 'Regulatory Authority' && (
                        <>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-physician">Register Physician</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-pharmacy">Register Pharmacy</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/register-patient">Register Patient</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/query-page">Account Query</Link>
                            </li>
                        </>
                    )}
                </ul>
                <div className="txcolor1">{role}</div>
            </div>
        </nav>
    );
};

export default Navbar;
