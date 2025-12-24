import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, placeholder = "Search services..." }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (value) => {
        setSearchTerm(value);
        onSearch(value);
    };

    const handleClear = () => {
        setSearchTerm('');
        onSearch('');
    };

    return (
        <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <Search className="w-5 h-5 text-cyber-cyan" />
            </div>

            <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                className="input-cyber pl-12 pr-12 w-full text-lg"
            />

            {searchTerm && (
                <button
                    onClick={handleClear}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:text-cyber-magenta transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
