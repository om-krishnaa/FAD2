import {
  Check,
  Edit,
  Eye,
  Filter,
  Hourglass,
  Image,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createAds,
  deleteAds,
  getAdsList,
  updateAds,
  updateAdStatus,
  updateAdTransactionStatus,
} from '../actions/ads';
import { useAuth } from '../contexts/AuthContext';
import { Ad } from '../types';
import AdForm from './forms/AdForm';
import ModalLayout from './layout/ModalLayout';

const AdView = ({
  isOpen,
  onClose,
  adData,
}: {
  isOpen: boolean;
  onClose: () => void;
  adData?: Partial<Ad> | null;
}) => {
  if (!isOpen || !adData) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <ModalLayout isOpen={isOpen} onClose={onClose} title="Ad Details">
      <div className="space-y-6 ">
        {/* Campaign Title */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {adData.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {adData.facility_name}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              adData.status!
            )}`}
          >
            {adData.status!.charAt(0).toUpperCase() + adData.status!.slice(1)}
          </span>
        </div>
        Ad Type
        <div className="flex items-center p-4 space-x-3 rounded-lg bg-gray-50 dark:bg-gray-700">
          {adData.ad_type === 'video' ? (
            <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <Image className="w-6 h-6 text-green-600 dark:text-green-400" />
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {adData.ad_type} Advertisement
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Campaign type
            </p>
          </div>
        </div>
        {/* Performance Metrics */}
        <div>
          <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Performance Metrics
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Total Views
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {adData?.actual_views?.toLocaleString()}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Click Through Rate
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {adData.click_through_rate}
                  </p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-full dark:bg-green-400">
                  <span className="text-sm font-bold text-white">%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Budget
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    Rs {adData?.budget?.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full dark:bg-purple-400">
                  <span className="text-xs font-bold text-white">Rs</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Amount Spent
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    Rs {adData?.spent_amount?.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-orange-600 rounded-full dark:bg-orange-400">
                  <span className="text-xs font-bold text-white">₹</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Budget Progress */}
        <div>
          <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Budget Usage
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Spent: Rs {adData?.spent_amount?.toLocaleString()}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Budget: Rs {adData?.budget?.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-3 transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                style={{
                  width: `${Math.min(
                    (Number(adData.spent_amount) / Number(adData.budget)) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(
                (Number(adData.spent_amount) / Number(adData.budget)) *
                100
              ).toFixed(1)}
              % of budget used
            </p>
          </div>
        </div>
        {/* Campaign Details */}
        <div>
          <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Campaign Details
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">
                Campaign ID
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                #{adData?.id?.toString().padStart(6, '0')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">
                Created Date
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {adData.created_at || adData?.created_at || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Facility</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {adData.facility_name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ModalLayout>
  );
};

const ManageAds = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Partial<Ad> | null>(null);

  const [ads, setAds] = useState<Partial<Ad>[] | null>(null);

  const { user } = useAuth();

  const { accessToken } = useAuth();

  const filteredAds = ads?.filter((ad) => {
    const matchesSearch =
      ad.title!.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.facility_name!.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ad.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleToggleStatus = async (id: number) => {
    if (!ads) return [];
    const newStatus =
      ads.find((ad) => ad.id === id)?.status === 'active' ? 'paused' : 'active';
    const res = (await updateAdStatus(id, newStatus, accessToken!)) as {
      success: boolean;
      message?: string;
    };
    if (!res.success) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Ad status updated successfully!');
    setAds(
      ads.map((ad) => {
        if (ad.id === id) {
          return {
            ...ad,
            status: ad.status === 'active' ? 'paused' : 'active',
          };
        }
        return ad;
      })
    );
  };

  const handleToggleTransactionStatus = async (
    id: number,
    status: string,
    approved_by: number
  ) => {
    if (!ads) return [];

    setAds(
      ads.map((ad) => {
        if (ad.id === id) {
          return {
            ...ad,
            transaction_status: status,
            approved_by: approved_by.toString(),
          };
        }
        return ad;
      })
    );

    const res = (await updateAdTransactionStatus(
      id,
      status,
      approved_by,
      accessToken!
    )) as {
      success: boolean;
      message?: string;
    };
    if (!res.success) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Ad status updated successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const makePaymentViaEsewa = (formData: any) => {
    var path = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    var form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', path);

    for (var key in formData) {
      var hiddenField = document.createElement('input');
      hiddenField.setAttribute('type', 'hidden');
      hiddenField.setAttribute('name', key);
      hiddenField.setAttribute('value', formData[key]);
      form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();
  };

  const makePaymentViaKhalti = (redirectUrl: any) =>
    (window.location.href = redirectUrl);

  const handleCreateAd = async (
    adData: Partial<Ad>,
    uploadedFile?: File,
    payment_method?: string
  ) => {
    const newAd: Partial<Ad> = {
      title: adData.title,
      ad_type: adData.ad_type as 'image' | 'video' | undefined,
      status: 'active' as Ad['status'],
      actual_views: 0,
      budget: adData.budget,
      spent_amount: '0',
      click_through_rate: '0%',
      facility_name: adData.facility_name,
      target_views: adData.target_views || '0',
    };

    const formData = new FormData();
    formData.append('title', adData.title!);
    formData.append('facility_name', adData.facility_name!);
    formData.append('budget', adData.budget!);
    formData.append('payment_method', payment_method!);

    formData.append('target_views', adData.target_views!);
    if (uploadedFile) formData.append('file', uploadedFile);
    const res = (await createAds(formData, accessToken!)) as {
      success: boolean;
      message?: string;
      formData?: any;
      redirectUrl?: any;
    };
    if (!res.success) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    if (payment_method === 'esewa') makePaymentViaEsewa(res.formData);
    if (payment_method === 'khalti') makePaymentViaKhalti(res.redirectUrl);

    toast.success('Ad created successfully!');
    setAds([...(ads ?? []), newAd]);
  };

  const handleUpdateAd = async (adData: Partial<Ad>, uploadedFile?: File) => {
    if (!ads) return;

    const formData = new FormData();
    formData.append('title', adData.title!);
    formData.append('facility_name', adData.facility_name!);

    formData.append('budget', adData.budget!);

    formData.append('target_views', adData.target_views!);
    if (uploadedFile) formData.append('file', uploadedFile);
    const res = (await updateAds(adData.id!, formData, accessToken!)) as {
      success: boolean;
      message?: string;
    };
    if (!res) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Ad Updated successfully!');
    setAds(
      ads.map((ad) => {
        if (ad.id === adData.id) {
          return {
            ...ad,
            title: adData.title,
            facility: adData.facility_name,
            budget: adData.budget,
            ad_type: adData.ad_type,
          };
        }
        return ad;
      })
    );
    setSelectedAd(null);
  };

  const handleDeleteAd = async (id: number) => {
    if (!ads) return;
    const res = (await deleteAds(id, accessToken!)) as {
      success: boolean;
      message?: string;
    };
    if (!res.success) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    toast.success('Ad deleted successfully!');
    setAds(ads.filter((ad) => ad.id !== id));
  };

  const handleViewAd = (ad: Partial<Ad>) => {
    setSelectedAd(ad);
    setShowViewModal(true);
  };

  const handleEditAd = (ad: Partial<Ad>) => {
    setSelectedAd(ad);
    setShowUpdateModal(true);
  };

  useEffect(() => {
    if (!accessToken) return;

    const fetchAds = async () => {
      try {
        const res = (await getAdsList(accessToken)) as Partial<Ad>[];
        if (!res) {
          toast.error('Something went wrong. Please try again.');
          return;
        }
        setAds(res);
      } catch (error) {
        console.error('Error fetching ads:', error);
        toast.error('Failed to load ads. Please try again.');
      }
    };
    fetchAds();
  }, [accessToken]);

  return (
    <div className="min-h-screen p-4 text-gray-900 bg-gray-50 dark:bg-gray-900 sm:p-6 lg:p-8 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col mb-6 space-y-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8 sm:space-y-0">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">
            Manage Ads
          </h1>
          <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
            Create, monitor, and manage advertisement campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center w-full px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg sm:px-6 sm:py-3 hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Create New Ad</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="p-4 mb-6 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700 sm:p-6 lg:mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search ads or facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-8 pr-4 text-gray-900 bg-white border border-gray-300 rounded-lg sm:pl-10 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-80"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400 sm:w-5 sm:h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block mb-6 space-y-4 lg:hidden">
        {filteredAds?.map((ad) => (
          <div
            key={ad.id}
            className="p-4 bg-white border border-gray-100 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                  {ad.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ad.facility_name}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  ad.status!
                )}`}
              >
                {ad.status!.charAt(0).toUpperCase() + ad.status!.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <div className="flex items-center mt-1 space-x-1">
                  {ad.ad_type === 'video' ? (
                    <Video className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Image className="w-4 h-4 text-green-600" />
                  )}
                  <span>{ad.ad_type}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Views:</span>
                <p className="font-medium">
                  {(ad?.actual_views || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Budget:
                </span>
                <p className="font-medium">Rs{ad?.budget?.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">CTR:</span>
                <p className="font-medium">{ad.click_through_rate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewAd(ad)}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-800"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditAd(ad)}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(ad.id!)}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-800"
                >
                  {ad?.transaction_status?.toLowerCase() === 'requested' ? (
                    <>abc</>
                  ) : ad?.status === 'active' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => handleDeleteAd(ad.id!)}
                  className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Spent: Rs{ad?.spent_amount?.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-hidden bg-white border border-gray-100 shadow-sm lg:block dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <tr>
                {[
                  'Ad Campaign',
                  'Type',
                  'Status',
                  'Views',
                  'Budget',
                  'Spent',
                  'CTR',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 font-semibold text-left text-gray-900 dark:text-gray-100"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAds?.map((ad) => (
                <tr
                  key={ad.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {ad.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {ad.facility_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {ad.ad_type === 'video' ? (
                        <Video className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Image className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {ad.ad_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        ad.status!
                      )}`}
                    >
                      {ad?.status?.charAt(0).toUpperCase() +
                        ad?.status!.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    {ad?.actual_views?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    Rs{ad?.budget?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    Rs{ad?.spent_amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                    {ad.click_through_rate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewAd(ad)}
                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditAd(ad)}
                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="flex space-x-2">
                        {user!.role === 'super_admin' ? (
                          <>
                            {/* Transaction Buttons */}
                            {ad?.transaction_status?.toLowerCase() ===
                              'requested' && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() =>
                                    handleToggleTransactionStatus(
                                      ad.id!,
                                      'approved',
                                      user!.id
                                    )
                                  }
                                  className="p-2 text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-800"
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    handleToggleTransactionStatus(
                                      ad.id!,
                                      'rejected',
                                      user!.id
                                    )
                                  }
                                  className="p-2 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Play/Pause Button */}
                            {ad?.transaction_status?.toLowerCase() !==
                              'requested' && (
                              <button
                                onClick={() => handleToggleStatus(ad.id!)}
                                className="p-2 text-gray-400 transition-colors rounded-lg hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-800"
                              >
                                {ad?.status === 'active' ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {ad?.transaction_status?.toLowerCase() ===
                              'approved' && (
                              <button
                                onClick={() => handleToggleStatus(ad.id!)}
                                className="p-2 text-gray-400 transition-colors rounded-lg hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-800"
                              >
                                {ad?.status === 'active' ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            {ad?.transaction_status?.toLowerCase() ===
                              'rejected' && (
                              <button
                                disabled
                                className="p-2 text-red-500 rounded-lg cursor-not-allowed"
                                title="Rejected"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}

                            {ad?.transaction_status?.toLowerCase() ===
                              'requested' && (
                              <button
                                disabled
                                className="p-2 text-gray-400 rounded-lg cursor-not-allowed"
                                title="Pending approval"
                              >
                                <Hourglass className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteAd(ad.id!)}
                        className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredAds?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 text-gray-400">
            <Search className="w-16 h-16" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            No ads found
          </h3>
          <p className="max-w-md text-center text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? "Try adjusting your search or filter criteria to find what you're looking for."
              : 'Get started by creating your first ad campaign to reach more customers.'}
          </p>
        </div>
      )}

      {/* Modals */}
      <AdForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAd}
        mode="create"
      />

      <AdForm
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedAd(null);
        }}
        onSubmit={handleUpdateAd}
        initialData={selectedAd}
        mode="update"
      />

      <AdView
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAd(null);
        }}
        adData={selectedAd}
      />
    </div>
  );
};

export default ManageAds;
