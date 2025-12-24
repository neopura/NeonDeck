import React, { useState } from 'react';
import { X, FolderPlus, Type, Palette, Layout, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import { categoriesAPI } from '../services/api';

const AddCategoryModal = ({ isOpen, onClose, onCategoryAdded }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        icon: 'folder',
        color: '#00d9ff',
        order_index: 0
    });

    if (!isOpen) return null;

    const colors = [
        { name: 'Cyan', value: '#00d9ff' },
        { name: 'Magenta', value: '#ff00ff' },
        { name: 'Purple', value: '#b026ff' },
        { name: 'Pink', value: '#ff0080' },
        { name: 'Blue', value: '#0080ff' },
        { name: 'Green', value: '#00ffaa' },
        { name: 'Red', value: '#ff4444' },
        { name: 'Orange', value: '#ea580c' },
        { name: 'Gray', value: '#888888' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Category name is required');
            return;
        }

        try {
            setLoading(true);
            const response = await categoriesAPI.create(formData);
            toast.success('Category created successfully!');
            onCategoryAdded(response.data);
            handleClose();
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error(error.response?.data?.detail || 'Failed to create category');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', icon: 'folder', color: '#00d9ff', order_index: 0 });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-cyber-dark border border-cyber-magenta/30 rounded-xl shadow-[0_0_30px_rgba(255,0,255,0.1)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-cyber-magenta/20">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <FolderPlus className="w-5 h-5 mr-2 text-cyber-magenta" />
                        New Category
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
                            <Type className="w-4 h-4 mr-2 text-cyber-magenta" />
                            Category Name
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full bg-cyber-darker border border-cyber-magenta/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-magenta/60 transition-colors"
                            placeholder="e.g., 3D Printers"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
                            <Palette className="w-4 h-4 mr-2 text-cyber-cyan" />
                            Theme Color
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {colors.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    className={`w-full aspect-square rounded-lg border-2 transition-all transform hover:scale-110 ${formData.color === color.value
                                            ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                                            : 'border-transparent'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center">
                            <Layout className="w-4 h-4 mr-2 text-gray-500" />
                            Display Order
                        </label>
                        <input
                            type="number"
                            className="w-full bg-cyber-darker border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyber-cyan/60 transition-colors"
                            value={formData.order_index}
                            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">
                            Lower numbers appear first.
                        </p>
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
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyber-magenta to-cyber-purple rounded-lg text-white font-bold hover:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Create
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCategoryModal;
