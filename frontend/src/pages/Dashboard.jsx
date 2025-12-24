import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, Plus, FolderPlus } from 'lucide-react';

import { servicesAPI, categoriesAPI, scannerAPI } from '../services/api';
import SearchBar from '../components/SearchBar';
import CategorySection from '../components/CategorySection';
import ScanStatus from '../components/ScanStatus';
import AddServiceModal from '../components/AddServiceModal';
import AddCategoryModal from '../components/AddCategoryModal';
import EditCategoryModal from '../components/EditCategoryModal';

const NeonDeck = () => {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [scanStatus, setScanStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanLoading, setScanLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Fetch initial data
    useEffect(() => {
        fetchData();
        fetchScanStatus();

        // Poll scan status every 10 seconds
        const interval = setInterval(fetchScanStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [servicesRes, categoriesRes] = await Promise.all([
                servicesAPI.getAll(),
                categoriesAPI.getAll()
            ]);

            setServices(servicesRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const fetchScanStatus = async () => {
        try {
            const res = await scannerAPI.getStatus();
            setScanStatus(res.data);
        } catch (error) {
            console.error('Error fetching scan status:', error);
        }
    };

    const handleTriggerScan = async () => {
        try {
            setScanLoading(true);
            await scannerAPI.trigger();
            toast.success('Network scan started!');

            // Refresh data after a short delay
            setTimeout(() => {
                fetchData();
                fetchScanStatus();
            }, 2000);
        } catch (error) {
            console.error('Error triggering scan:', error);
            toast.error('Failed to start scan');
        } finally {
            setScanLoading(false);
        }
    };

    const handleDeleteService = async (serviceId) => {
        try {
            await servicesAPI.delete(serviceId);
            setServices(services.filter(s => s.id !== serviceId));
            toast.success('Service deleted');
        } catch (error) {
            console.error('Error deleting service:', error);
            toast.error('Error deleting service');
        }
    };

    const handleUpdateCategory = async (serviceId, categoryId) => {
        try {
            await servicesAPI.update(serviceId, { category_id: categoryId });
            setServices(services.map(s =>
                s.id === serviceId ? { ...s, category_id: categoryId } : s
            ));
            toast.success('Category updated');
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Error updating category');
        }
    };

    // Filter services by search term
    const filteredServices = services.filter((service) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            service.name.toLowerCase().includes(search) ||
            service.url.toLowerCase().includes(search) ||
            (service.description && service.description.toLowerCase().includes(search))
        );
    });

    // Group services by category
    const servicesByCategory = categories.map((category) => ({
        ...category,
        services: filteredServices.filter((s) => s.category_id === category.id)
    }));

    // Uncategorized services
    const uncategorizedServices = filteredServices.filter((s) => !s.category_id);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cyber-darker">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-cyber-cyan">Loading NeonDeck...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cyber-darker grid-bg">
            <ToastContainer
                position="top-right"
                theme="dark"
                toastStyle={{ backgroundColor: '#0a0e1a', border: '1px solid #00d9ff' }}
            />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-magenta to-cyber-purple mb-2">
                        NeonDeck
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Network Service Discovery & Inventory
                    </p>
                </div>

                {/* Scan Status & Add Button */}
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
                    <div className="flex-grow">
                        <ScanStatus
                            status={scanStatus}
                            onTriggerScan={handleTriggerScan}
                            loading={scanLoading}
                        />
                    </div>
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="h-[52px] px-6 bg-cyber-dark border border-cyber-magenta/30 rounded-xl text-cyber-magenta font-bold hover:bg-cyber-magenta/10 hover:border-cyber-magenta/60 transition-all flex items-center justify-center space-x-2 group"
                        title="Add New Category"
                    >
                        <FolderPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Add Category</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-[52px] px-6 bg-cyber-dark border border-cyber-cyan/30 rounded-xl text-cyber-cyan font-bold hover:bg-cyber-cyan/10 hover:border-cyber-cyan/60 transition-all flex items-center justify-center space-x-2 group"
                        title="Add Manual Service"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Manual Entry</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <SearchBar
                        onSearch={setSearchTerm}
                        placeholder="Search services by name, URL, or description..."
                    />
                </div>



                {/* Services by Category */}
                <div className="cyber-scrollbar">
                    {servicesByCategory.map((category) => (
                        <CategorySection
                            key={category.id}
                            category={category}
                            services={category.services}
                            onDeleteService={handleDeleteService}
                            onUpdateCategory={handleUpdateCategory}
                            categories={categories}
                            onEditCategory={(cat) => setEditingCategory(cat)}
                        />
                    ))}

                    {/* Uncategorized */}
                    {uncategorizedServices.length > 0 && (
                        <CategorySection
                            category={{ name: 'Uncategorized', color: '#888888' }}
                            services={uncategorizedServices}
                            onDeleteService={handleDeleteService}
                            onUpdateCategory={handleUpdateCategory}
                            categories={categories}
                        />
                    )}

                    {/* No results */}
                    {filteredServices.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg">
                                {searchTerm ? 'No services found matching your search' : 'No services discovered yet. Click "Scan Network" to start.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <AddServiceModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    categories={categories}
                    onServiceAdded={(newService) => {
                        setServices([...services, newService]);
                        // Optional: trigger refresh to ensure counts are right
                        fetchData();
                    }}
                />
                <AddCategoryModal
                    isOpen={isCategoryModalOpen}
                    onClose={() => setIsCategoryModalOpen(false)}
                    onCategoryAdded={(newCategory) => {
                        setCategories([...categories, newCategory]);
                        fetchData(); // Refresh to ensure service counts and sorting are correct
                    }}
                />
                <EditCategoryModal
                    isOpen={!!editingCategory}
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onCategoryUpdated={(updatedCat) => {
                        setCategories(categories.map(c => c.id === updatedCat.id ? updatedCat : c));
                        fetchData();
                    }}
                    onCategoryDeleted={(deletedId) => {
                        setCategories(categories.filter(c => c.id !== deletedId));
                        fetchData();
                    }}
                />
            </div>
        </div>
    );
};

export default NeonDeck;
