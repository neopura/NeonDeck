import React, { useState } from 'react';
import { ExternalLink, Clock, Wifi, Trash2, Edit3, X } from 'lucide-react';

// Helper to get domain from URL
const getDomain = (url) => {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
};

// Helper to get a search-friendly name
const getSearchName = (name) => {
    return name.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
};

// ServiceIcon component with automatic favicon fallback
const ServiceIcon = ({ service }) => {
    const [imgError, setImgError] = useState(0);
    const [useAvatar, setUseAvatar] = useState(false);

    const domain = getDomain(service.url);

    // Generate a consistent color based on service name
    const getColorFromName = (name) => {
        const colors = ['0891b2', '7c3aed', 'db2777', 'ea580c', '16a34a', '2563eb', 'dc2626', '9333ea'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const bgColor = getColorFromName(service.name);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(service.name)}&background=${bgColor}&color=fff&size=64&font-size=0.35&bold=true`;

    // If we have a stored favicon_url, try it first
    if (service.favicon_url && !imgError && !useAvatar) {
        return (
            <img
                src={service.favicon_url}
                alt={service.name}
                className="w-12 h-12 rounded object-contain bg-cyber-dark"
                onError={() => setUseAvatar(true)}
            />
        );
    }

    // Try domain favicon from Google S2, but fall back to avatar on error
    if (domain && !useAvatar && imgError === 0) {
        return (
            <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt={service.name}
                className="w-12 h-12 rounded object-contain bg-cyber-dark"
                onError={() => setUseAvatar(true)}
                onLoad={(e) => {
                    // If the image is too small (generic globe), use avatar instead
                    if (e.target.naturalWidth < 32) {
                        setUseAvatar(true);
                    }
                }}
            />
        );
    }

    // Use colorful avatar with initials
    return (
        <img
            src={avatarUrl}
            alt={service.name}
            className="w-12 h-12 rounded"
        />
    );
};

const ServiceCard = ({ service, onDelete, onUpdateCategory, categories }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const handleClick = (e) => {
        if (showConfirm || showCategoryPicker) return;
        window.open(service.url, '_blank', 'noopener,noreferrer');
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowConfirm(true);
    };

    const handleConfirmDelete = async (e) => {
        e.stopPropagation();
        if (onDelete) {
            await onDelete(service.id);
        }
        setShowConfirm(false);
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setShowConfirm(false);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        setShowCategoryPicker(true);
    };

    const handleCategorySelect = async (e, categoryId) => {
        e.stopPropagation();
        if (onUpdateCategory) {
            await onUpdateCategory(service.id, categoryId);
        }
        setShowCategoryPicker(false);
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setShowCategoryPicker(false);
    };

    return (
        <>
            {/* Category picker modal - large centered modal */}
            {showCategoryPicker && categories && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={handleCancelEdit}
                >
                    <div
                        className="bg-cyber-dark border border-cyber-cyan/30 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-white">Change Category</h3>
                            <button
                                onClick={handleCancelEdit}
                                className="p-2 hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Service: <span className="text-cyber-cyan font-medium">{service.name}</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={(e) => handleCategorySelect(e, cat.id)}
                                    className="px-4 py-3 rounded-lg font-medium transition-all hover:scale-[1.02] text-left"
                                    style={{
                                        backgroundColor: cat.id === service.category_id ? cat.color : `${cat.color}20`,
                                        color: cat.id === service.category_id ? '#000' : cat.color,
                                        border: `2px solid ${cat.color}`
                                    }}
                                >
                                    {cat.id === service.category_id && '✓ '}{cat.name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleCancelEdit}
                            className="mt-6 w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div
                onClick={handleClick}
                className="cyber-card cursor-pointer group relative overflow-hidden min-h-[180px] flex flex-col"
            >
                {/* Delete confirmation overlay */}
                {showConfirm && (
                    <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center p-4">
                        <p className="text-white text-center mb-4">Delete <strong>{service.name}</strong>?</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Action buttons - bottom right */}
                <div className="absolute bottom-3 right-3 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={handleEditClick}
                        className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40"
                        title="Change category"
                    >
                        <Edit3 className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40"
                        title="Delete service"
                    >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                    </button>
                </div>

                {/* Status indicator - moved to top left */}
                <div className="absolute top-2 left-2">
                    <div className={`w-2 h-2 rounded-full ${service.status === 'active' ? 'bg-green-500 pulse-glow' : 'bg-gray-500'}`} />
                </div>

                {/* Service icon/favicon with automatic fallback */}
                <div className="flex items-start space-x-4 mb-3">
                    <ServiceIcon service={service} />

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-100 truncate group-hover:text-cyber-cyan transition-colors">
                            {service.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                            {service.url}
                        </p>
                    </div>

                    <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-cyber-cyan transition-colors" />
                </div>

                {/* Description */}
                {service.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {service.description}
                    </p>
                )}

                {/* Spacer to push metadata to bottom */}
                <div className="flex-1" />

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {service.response_time && (
                        <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{service.response_time}ms</span>
                        </div>
                    )}
                    {service.ip_address && (
                        <span className="font-mono">{service.ip_address}:{service.port}</span>
                    )}
                    {service.protocol && (
                        <span className="uppercase text-cyber-cyan">{service.protocol}</span>
                    )}
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/0 via-cyber-cyan/5 to-cyber-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </>
    );
};

export default ServiceCard;
