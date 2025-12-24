import React from 'react';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const ScanStatus = ({ status, onTriggerScan, loading }) => {
    const getStatusIcon = () => {
        switch (status?.status) {
            case 'running':
                return <RefreshCw className="w-5 h-5 text-cyber-cyan animate-spin" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusText = () => {
        if (status?.status === 'running') {
            return 'Scanning network...';
        }
        return status?.message || 'No scan running';
    };

    return (
        <div className="cyber-card inline-flex items-center space-x-4">
            {getStatusIcon()}

            <div className="flex-1">
                <p className="text-sm text-gray-300">{getStatusText()}</p>
            </div>

            <button
                onClick={onTriggerScan}
                disabled={loading || status?.status === 'running'}
                className="btn-cyber disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                    'Scan Network'
                )}
            </button>
        </div>
    );
};

export default ScanStatus;
