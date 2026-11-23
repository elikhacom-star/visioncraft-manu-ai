import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingPage from '../components/LandingPage';

export default function Landing() {
    const navigate = useNavigate();
    return (
        <LandingPage 
            onTryDemo={() => navigate('/', { state: { showDemo: true } })} 
        />
    );
}