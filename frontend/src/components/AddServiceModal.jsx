import React, { useState } from 'react';
import { X, Plus, Globe, Type, Tag, AlignLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { servicesAPI } from '../services/api';

const AddServiceModal = ({ isOpen, onClose, categories, onServiceAdded }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        description: '',
        category_id: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.url) {
            toast.error('Name and URL are required');
            return;
        }

        // URL validation (simple check)
        if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
            toast.error('URL must start with http:// or https://');
            return;
        }

        try {
            setLoading(true);
            const response = await servicesAPI.create({
                ...formData,
                category_id: formData.category_id ? parseInt(formData.category_id) : null
            });

            toast.success('Service added successfully!');
            onServiceAdded(response.data);
            handleClose();
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error(error.response?.data?.detail || 'Failed to add service');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', url: '', description: '', category_id: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-cyber-dark border border-cyber-cyan/30 rounded-xl shadow-[0_0_30px_rgba(0,217,255,0.1)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-cyber-cyan/20">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-cyber-cyan" />
                        Add Manual Service
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center">
                            <Type className="w-4 h-4 mr-2 text-cyber-cyan" />
                            Service Name
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full bg-cyber-darker border border-cyber-cyan/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-cyan/60 transition-colors"
                            placeholder="e.g., My Personal NAS"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center">
                            <Globe className="w-4 h-4 mr-2 text-cyber-cyan" />
                            URL
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full bg-cyber-darker border border-cyber-cyan/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-cyan/60 transition-colors"
                            placeholder="https://192.168.1.X:PORT"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center">
                            <Tag className="w-4 h-4 mr-2 text-cyber-magenta" />
                            Category
                        </label>
                        <select
                            className="w-full bg-cyber-darker border border-cyber-cyan/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-cyan/60 transition-colors appearance-none"
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        >
                            <option value="">Uncategorized</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center">
                            <AlignLeft className="w-4 h-4 mr-2 text-gray-500" />
                            Description (Optional)
                        </label>
                        <textarea
                            className="w-full bg-cyber-darker border border-cyber-cyan/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-cyan/60 transition-colors h-24 resize-none"
                            placeholder="What is this service for?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-white/5 transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-blue rounded-lg text-cyber-darker font-bold hover:shadow-[0_0_15px_rgba(0,217,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Add Service'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddServiceModal;
