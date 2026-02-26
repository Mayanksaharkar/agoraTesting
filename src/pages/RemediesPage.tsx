import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { remedyApi } from '@/services/remedyApi';
import { Remedy } from '@/types/remedy';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, ShoppingBag, BookOpen, Phone, Wind } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RemediesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const remediesRes = await remedyApi.getAllRemedies();
      setRemedies(remediesRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load remedies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRemedies = remedies.filter(remedy =>
    remedy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    remedy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    remedy.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group remedies by category
  const groupedRemedies = groupByCategory(filteredRemedies);

  const handleRemedyClick = (remedyId: string) => {
    navigate(`/user/remedies/${remedyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">🔮 Remedies</h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search remedies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-100 border-0"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Personalized Remedy of the Day - Featured */}
        {remedies.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personalized Remedy of the Day</h2>
            <RemedyCardLarge
              remedy={remedies[0]}
              onClick={() => handleRemedyClick(remedies[0]._id)}
            />
          </div>
        )}

        {/* Category Sections */}
        {filteredRemedies.length > 0 ? (
          Object.entries(groupedRemedies).map(([categoryName, remedyList]) => (
            <div key={categoryName} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {getCategoryDisplayName(categoryName)}
                </h2>
                {remedyList.length > 4 && (
                  <button className="text-sm text-green-600 font-medium hover:text-green-700">
                    View All →
                  </button>
                )}
              </div>

              {/* Grid - 2 columns on mobile, 3-4 on larger screens */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {remedyList.slice(0, 4).map((remedy) => (
                  <RemedyCardSmall
                    key={remedy._id}
                    remedy={remedy}
                    onClick={() => handleRemedyClick(remedy._id)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No remedies found</h3>
            <p className="text-gray-500">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to group remedies by category
function groupByCategory(remedies: Remedy[]): Record<string, Remedy[]> {
  const groups: Record<string, Remedy[]> = {};

  remedies.forEach(remedy => {
    if (!groups[remedy.category]) {
      groups[remedy.category] = [];
    }
    groups[remedy.category].push(remedy);
  });

  // Sort by predefined order
  const categoryOrder = ['VIP E-Pooja', 'Palmistry', 'Career', 'Name Correction', 'Face Reading', 'Problem Solving', 'Remedy Combos'];
  const sortedGroups: Record<string, Remedy[]> = {};

  categoryOrder.forEach(cat => {
    if (groups[cat]) {
      sortedGroups[cat] = groups[cat];
    }
  });

  // Add remaining categories
  Object.keys(groups).forEach(cat => {
    if (!categoryOrder.includes(cat)) {
      sortedGroups[cat] = groups[cat];
    }
  });

  return sortedGroups;
}

// Helper function for category display names
function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    'VIP E-Pooja': '🏛️ Paid Remedies',
    'Palmistry': '🤲 Palmistry',
    'Career': '💼 Career',
    'Name Correction': '✍️ Name Correction',
    'Face Reading': '👤 Face Reading',
    'Problem Solving': '🧩 Problem Solving',
    'Remedy Combos': '🎁 Remedy Combos'
  };

  return categoryNames[category] || category;
}

// Large Featured Remedy Card
const RemedyCardLarge = ({
  remedy,
  onClick
}: {
  remedy: Remedy;
  onClick: () => void;
}) => {
  const startPrice = remedy.base_price || 0;

  return (
    <div
      className="relative cursor-pointer rounded-2xl overflow-hidden h-64 group"
      onClick={onClick}
    >
      {/* Background Image */}
      <img
        src={remedy.image || '/placeholder-remedy.jpg'}
        alt={remedy.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/600x300?text=' + encodeURIComponent(remedy.title);
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="text-white">
          <Badge className="mb-2 bg-green-500 text-white w-fit">
            {remedy.category}
          </Badge>
          <h3 className="text-xl font-bold mb-2 line-clamp-2">
            {remedy.title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-200">
              {remedy.duration_minutes} mins
            </p>
            <p className="text-md font-semibold">
              START AT INR {startPrice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small Remedy Card
const RemedyCardSmall = ({
  remedy,
  onClick
}: {
  remedy: Remedy;
  onClick: () => void;
}) => {
  const startPrice = remedy.base_price || 0;

  return (
    <div
      className="relative cursor-pointer rounded-lg overflow-hidden h-40 group"
      onClick={onClick}
    >
      {/* Background Image */}
      <img
        src={remedy.image || '/placeholder-remedy.jpg'}
        alt={remedy.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(remedy.title);
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Price Badge - Top Left */}
      <div className="absolute top-2 left-2">
        <Badge className="bg-green-500 text-white text-xs font-bold">
          INR {startPrice}
        </Badge>
      </div>

      {/* Content Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-xs font-semibold line-clamp-2">
          {remedy.title}
        </p>
      </div>
    </div>
  );
};


export default RemediesPage;