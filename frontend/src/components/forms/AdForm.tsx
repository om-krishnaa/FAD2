import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BiMoney, BiPaperPlane } from 'react-icons/bi';
import { Ad, SystemSettings } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getSettings } from '../../actions/settings';
import Loader from '../Loader';

type AdFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    adData: Partial<Ad>,
    uploadedFile?: File,
    payment_method?: string
  ) => void;
  initialData?: Partial<Ad> | null;
  mode?: 'create' | 'update';
};

export default function AdForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: AdFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('esewa');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const { user, accessToken } = useAuth();
  const [formData, setFormData] = useState<{
    title: string;
    facility_name: string;
    budget: string;
    target_views: string;
    uploadedFile: File | null;
    id?: number;
  }>({
    title: initialData?.title || '',
    facility_name: initialData?.facility_name || '',
    budget: initialData?.budget?.toString() || '',
    target_views: '',
    uploadedFile: null,
  });
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title!,
        facility_name: initialData.facility_name!,
        budget: initialData.budget?.toString() || '',
        target_views: initialData.target_views?.toString() || '',
        uploadedFile: null,
        id: initialData.id,
      });
      setThumbnailUrl(initialData.content_url!);
    }
  }, [initialData]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = (await getSettings(accessToken)) as SystemSettings;
        if (!response) return;
        setSettings(response);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [accessToken]);

  useEffect(() => {
    if (user!.role === 'super_admin') setPaymentMethod('admin_approved');
  }, []);

  const handleSubmit = () => {
    if (!formData.title || !formData.facility_name || !formData.budget) {
      alert('Please fill in all required fields');
      return;
    }

    const adData: Partial<Ad> = {
      ...formData,
      budget: formData.budget,
      target_views: formData.target_views,
    };

    if (initialData) {
      adData.id = initialData.id;
    }

    onSubmit(adData, formData.uploadedFile || undefined, paymentMethod);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      facility_name: '',
      budget: '',
      target_views: '',
      uploadedFile: null,
    });
    setPaymentMethod('');
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'video/mp4',
        'video/mov',
        'video/quicktime',
      ];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert('Please upload a valid file type: JPG, PNG, MP4, or MOV');
        return;
      }

      setFormData({ ...formData, uploadedFile: file });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB');
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'video/mp4',
        'video/mov',
        'video/quicktime',
      ];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert('Please upload a valid file type: JPG, PNG, MP4, or MOV');
        return;
      }

      setFormData({ ...formData, uploadedFile: file });
    }
  };

  if (!isOpen) return null;
  if (loading) return <Loader />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
            {mode === 'create'
              ? 'Create New Ad Campaign'
              : 'Update Ad Campaign'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-6 sm:p-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Campaign Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter campaign title"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Facility Name *
            </label>
            <input
              type="text"
              value={formData.facility_name}
              onChange={(e) =>
                setFormData({ ...formData, facility_name: e.target.value })
              }
              className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter facility name"
            />
          </div>

          <div>
            <label className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload Content
            </label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => {
                const fileInput = document.getElementById(
                  'fileInput'
                ) as HTMLInputElement;
                if (fileInput) fileInput.click();
              }}
              className="p-4 text-center transition-all duration-200 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer dark:border-gray-600 sm:p-6 lg:p-8 hover:border-blue-400 dark:hover:border-blue-500 group"
            >
              {formData.uploadedFile ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 mb-3 bg-green-100 rounded-full sm:w-12 sm:h-12 lg:w-16 lg:h-16 dark:bg-green-900 sm:mb-4">
                    <svg
                      className="w-6 h-6 text-green-600 sm:w-8 sm:h-8 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  <p className="mb-1 text-sm font-medium text-green-600 dark:text-green-400 sm:text-base lg:text-lg sm:mb-2">
                    File uploaded successfully!
                  </p>

                  {formData.uploadedFile && (
                    <div className="mb-2">
                      {formData.uploadedFile.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(formData.uploadedFile)}
                          alt="Preview"
                          className="object-contain w-32 h-20 rounded-md shadow"
                        />
                      ) : formData.uploadedFile.type.startsWith('video/') ? (
                        <video
                          src={URL.createObjectURL(formData.uploadedFile)}
                          controls
                          className="w-32 h-20 rounded-md shadow"
                        />
                      ) : null}
                    </div>
                  )}

                  <p className="px-2 mb-2 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
                    {formData.uploadedFile.name} (
                    {(formData.uploadedFile.size / (1024 * 1024)).toFixed(2)}{' '}
                    MB)
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, uploadedFile: null });
                    }}
                    className="text-xs text-red-600 underline sm:text-sm dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Remove file
                  </button>
                </div>
              ) : thumbnailUrl ? (
                <div className="flex flex-col items-center">
                  {thumbnailUrl.match(/\.(mp4|mov)$/i) ? (
                    <video
                      src={import.meta.env.VITE_BACKEND_URL + thumbnailUrl}
                      controls
                      className="w-40 mb-3 rounded-lg shadow h-28"
                    />
                  ) : (
                    <img
                      src={import.meta.env.VITE_BACKEND_URL + thumbnailUrl}
                      alt="Uploaded preview"
                      className="object-cover w-40 mb-3 rounded-lg shadow h-28"
                    />
                  )}
                  <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                    Previously uploaded file
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData });
                      setThumbnailUrl(null);
                    }}
                    className="text-xs text-red-600 underline sm:text-sm dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 transition-colors duration-200 sm:w-12 sm:h-12 lg:w-16 lg:h-16 group-hover:text-blue-500 dark:group-hover:text-blue-400 sm:mb-4" />
                  <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300 sm:text-base lg:text-lg sm:mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="px-2 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    Supports: JPG, PNG, MP4, MOV (Max 50MB)
                  </p>
                </div>
              )}
            </div>

            <input
              id="fileInput"
              type="file"
              accept=".jpg,.jpeg,.png,.mp4,.mov"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Budget (Rs) *
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => {
                  const budget = e.target.value;
                  setFormData({
                    ...formData,
                    budget,
                    target_views: budget
                      ? Math.floor(
                          Number(budget) / Number(settings?.cost_per_view)
                        ).toString()
                      : '',
                  });
                }}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Views
              </label>
              <input
                type="number"
                value={formData.target_views}
                disabled
                className="w-full px-3 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-600 dark:text-gray-300"
                placeholder="5000"
              />
            </div>
          </div>

          {user!.role !== 'super_admin' && mode === 'create' && (
            <div>
              <label className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Pay Via
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <button
                  onClick={() => setPaymentMethod('esewa')}
                  className={`flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-lg transition-all duration-200 min-h-[56px] sm:min-h-[64px] ${
                    paymentMethod === 'esewa'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-md'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:shadow-sm'
                  }`}
                >
                  <BiMoney className="w-5 h-5 text-blue-600 sm:w-6 sm:h-6 dark:text-blue-400" />
                  <span className="text-sm font-medium sm:text-base">
                    Esewa
                  </span>
                </button>
                <button
                  onClick={() => setPaymentMethod('khalti')}
                  className={`flex items-center justify-center space-x-2 sm:space-x-3 p-3 sm:p-4 border-2 rounded-lg transition-all duration-200 min-h-[56px] sm:min-h-[64px] ${
                    paymentMethod === 'khalti'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-md'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:shadow-sm'
                  }`}
                >
                  <BiPaperPlane className="w-5 h-5 text-blue-600 sm:w-6 sm:h-6 dark:text-blue-400" />
                  <span className="text-sm font-medium sm:text-base">
                    Khalti
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col p-4 space-y-2 border-t border-gray-200 sm:p-6 dark:border-gray-700 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-4">
          <button
            onClick={handleClose}
            className="w-full px-6 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg sm:w-auto dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg sm:w-auto hover:bg-blue-700"
          >
            {mode === 'create' ? 'Create Campaign' : 'Update Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
