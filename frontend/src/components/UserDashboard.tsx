'use client';

import {
  ArrowRight,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  Facebook,
  Filter,
  Gift,
  ImageIcon,
  Instagram,
  LogOut,
  Moon,
  Pause,
  Play,
  Share2,
  Sun,
  Timer,
  TrendingUp,
  Video,
  Volume2,
  VolumeX,
  Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createViewAd, getAds } from '../actions/ads';
import { requestPayment } from '../actions/payments';
import { getMyReferrals } from '../actions/referrals';
import { getSettings } from '../actions/settings';
import { getUser } from '../actions/users';
import { useAuth } from '../contexts/AuthContext';
import { Referral, SystemSettings, User, ViewAdType } from '../types';
import Loader from './Loader';

interface Ad {
  id: string;
  title: string;
  content_url: string;
  ad_type: 'video' | 'image';
  earnings_per_view: number;
}

export default function UserDashboard() {
  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [referrals, setReferrals] = useState<Referral[] | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const navigate = useNavigate();
  const { logout, accessToken, user } = useAuth();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<null | SystemSettings>(null);
  const [viewDuration, setViewDuration] = useState(0);
  const [ipAddress, setIpAddress] = useState('');
  const [mediaList, setMediaList] = useState<Ad[] | null>(null);
  const [adFilter, setAdFilter] = useState<'all' | 'video' | 'image'>('all');
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);

  const [isViewing, setIsViewing] = useState(false);
  const [viewTimer, setViewTimer] = useState(0);
  const [watchedAds, setWatchedAds] = useState<string[]>([]);
  const [availableAds, setAvailableAds] = useState<Ad[]>([]);
  const [timerCompleted, setTimerCompleted] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const referralLink = `${import.meta.env.VITE_FRONTEND_URL}?ref=${user?.id}`;

  const handleRequestPayment = async (payment_method: string) => {
    try {
      const res = (await requestPayment(accessToken!, payment_method)) as {
        success: boolean;
        message: string;
      };
      if (!res.success)
        return toast.error(res.message || 'Payment Request Failed.');
      setUserDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          current_balance: (0).toString(),
        };
      });
      toast.success(res.message || 'Payment Request Successful.');
    } catch (error) {
      toast.error('Payment Request Failed. Please try again.');
    }
  };

  const handleSendAdView = async () => {
    if (!user || timerCompleted) return;

    let fullDuration = 0;
    let durationWatched = 0;
    let completionPercentage = 0;
    if (videoRef.current instanceof HTMLVideoElement) {
      fullDuration = Math.floor(videoRef.current.duration) - 1;
      durationWatched = Math.floor(videoRef.current.currentTime) - 1;
      completionPercentage = fullDuration
        ? parseFloat(((durationWatched / fullDuration) * 100).toFixed(2))
        : 0;
    } else {
      // For images, mark full duration as 1 second and completion 100%
      fullDuration = 15;
      durationWatched = 15;
      completionPercentage = 100;
    }

    const payload = {
      user_id: user.id,
      campaign_id: currentMedia?.id,
      view_duration: durationWatched,
      full_duration: fullDuration,
      completion_percentage: completionPercentage,
      device_type: /Mobi|Android/i.test(navigator.userAgent)
        ? 'mobile'
        : 'desktop',
      ip_address: ipAddress,
      is_completed: completionPercentage >= 99 ? true : false,
    };

    try {
      const res = (await createViewAd(payload as ViewAdType, accessToken!)) as {
        success: boolean;
        message: string;
        earnings: string;
      };
      if (res?.success) {
        setUserDetails((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            current_balance: (
              Number(prev.current_balance || 0) +
              Number(settings?.cost_per_view!)
            ).toString(),
            total_earned: (
              Number(prev.total_earned || 0) + Number(settings?.cost_per_view!)
            ).toString(),
          };
        });
        console.log('ADES earned successfully!');
      } else {
        console.error(res?.message || 'Failed to record ad view.');
      }
    } catch (err) {
      console.error('Failed to send ad view:', err);
    }
  };
  const startViewing = () => {
    if (isViewing) return;

    setIsViewing(true);
    setViewTimer(0);
    setTimerCompleted(false);

    const currentAd = getCurrentAd();
    if (currentAd?.ad_type === 'video' && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }

    timerRef.current = setInterval(() => {
      setViewTimer((prev) => {
        const newTime = prev + 1;

        if (newTime >= 15) {
          setTimerCompleted(true);
          const currentAd = getCurrentAd();
          if (currentAd) {
            setUserDetails((prevCount) => {
              if (!prevCount) return prevCount;
              return {
                ...prevCount,
                ads_watched_count: prevCount.ads_watched_count + 1,
              };
            });
            if (!loading) {
              setLoading(true);
              handleSendAdView();
              setLoading(false);
            }
          }

          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 15;
        }

        return newTime;
      });
    }, 1000);
  };

  const proceedToNext = () => {
    const currentAd = getCurrentAd();
    if (!currentAd) return;

    setWatchedAds((prev) => [...prev, currentAd.id]);

    setIsViewing(false);
    setViewTimer(0);
    setTimerCompleted(false);

    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const nextIndex = (currentMediaIndex + 1) % filteredAds.length;
    setCurrentMediaIndex(nextIndex);
  };

  const getCurrentAd = () => {
    return mediaList && mediaList[currentMediaIndex];
  };

  const getAvailableFilteredAds = () => {
    if (!availableAds) return [];

    switch (adFilter) {
      case 'video':
        return availableAds.filter((ad) => ad.ad_type === 'video');
      case 'image':
        return availableAds.filter((ad) => ad.ad_type === 'image');
      default:
        return availableAds;
    }
  };

  const filterAds = (filter: 'all' | 'video' | 'image') => {
    if (!mediaList) return [];

    switch (filter) {
      case 'video':
        return mediaList.filter((ad) => ad.ad_type === 'video');
      case 'image':
        return mediaList.filter((ad) => ad.ad_type === 'image');
      default:
        return mediaList;
    }
  };

  const togglePlay = () => {
    if (!isViewing) {
      startViewing();
      return;
    }

    if (videoRef.current) {
      if (isPlaying) {
        // Pause video
        videoRef.current.pause();
        setIsPlaying(false);

        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Play video
        videoRef.current.play();
        setIsPlaying(true);

        // Resume timer
        timerRef.current = setInterval(() => {
          setViewTimer((prev) => {
            const newTime = prev + 1;

            if (newTime >= 15) {
              setTimerCompleted(true);
              const currentAd = getCurrentAd();
              if (currentAd) {
                const earnings = currentAd.earnings_per_view;
                setBalance((prevBalance) => prevBalance + earnings);
                setTotalEarnings((prevTotal) => prevTotal + earnings);
                setUserDetails((prevCount) => {
                  if (!prevCount) return prevCount;
                  return {
                    ...prevCount,
                    ads_watched_count: prevCount.ads_watched_count + 1,
                  };
                });
                if (!loading) {
                  setLoading(true);
                  handleSendAdView();
                  setLoading(false);
                }
              }

              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              return 15;
            }

            return newTime;
          });
        }, 1000);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newTime = Number.parseFloat(e.target.value);
  //   setCurrentTime(newTime);
  //   if (videoRef.current) {
  //     videoRef.current.currentTime = newTime;
  //   }
  // };

  // const formatTime = (time: number) => {
  //   const minutes = Math.floor(time / 60);
  //   const seconds = Math.floor(time % 60);
  //   return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  // };

  useEffect(() => {
    if (mediaList) {
      const available = mediaList.filter((ad) => !watchedAds.includes(ad.id));
      setAvailableAds(available);

      const currentAd = getCurrentAd();
      if (currentAd && watchedAds.includes(currentAd.id)) {
        const nextAvailable = available[0];
        if (nextAvailable) {
          const nextIndex = mediaList.findIndex(
            (ad) => ad.id === nextAvailable.id
          );
          setCurrentMediaIndex(nextIndex);
        }
      }
    }
  }, [watchedAds, mediaList]);

  useEffect(() => {
    if (!accessToken) return;
    
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const res = (await getUser(accessToken)) as User;
        if (!res) {
          toast.error('Something went wrong. Please try again.');
          return;
        }
        setUserDetails(res);
      } catch (error) {
        console.error('Error fetching user details:', error);
        toast.error('Failed to load user details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [accessToken]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setIpAddress(data.ip))
      .catch(() => setIpAddress(''));
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const fetchSettings = async () => {
      try {
        const response = (await getSettings(accessToken)) as SystemSettings;
        if (!response) return;
        setSettings(response);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings.');
      }
    };
    fetchSettings();
  }, [accessToken]);

  useEffect(() => {
    const currentMedia = mediaList && mediaList[currentMediaIndex];
    const isVideo = currentMedia && currentMedia.ad_type === 'video';

    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;

    let interval: ReturnType<typeof setInterval>;

    const startTracking = () => {
      interval = setInterval(() => {
        setViewDuration(video.currentTime);
      }, 1000);
    };
    const stopTracking = () => clearInterval(interval);

    video.addEventListener('play', startTracking);
    video.addEventListener('pause', stopTracking);
    video.addEventListener('ended', stopTracking);

    return () => {
      video.removeEventListener('play', startTracking);
      video.removeEventListener('pause', stopTracking);
      video.removeEventListener('ended', stopTracking);
      clearInterval(interval);
    };
  }, [currentMediaIndex, mediaList]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchAds = async () => {
      try {
        const res = (await getAds(accessToken)) as Ad[];
        if (!res) {
          toast.error('Something went wrong. Please try again.');
          return;
        }
        setMediaList(res);
      } catch (error) {
        console.error('Error fetching ads:', error);
        toast.error('Failed to load ads. Please try again.');
      }
    };
    fetchAds();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchReferrals = async () => {
      try {
        const res = (await getMyReferrals(accessToken)) as Referral[];
        if (!res) {
          toast.error('Something went wrong. Please try again.');
          return;
        }
        setReferrals(res);
      } catch (error) {
        console.error('Error fetching referrals:', error);
        toast.error('Failed to load referrals. Please try again.');
      }
    };
    fetchReferrals();
  }, [accessToken]);

  useEffect(() => {
    setFilteredAds(filterAds(adFilter));
  }, [adFilter, mediaList]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const shareToSocial = (platform: string) => {
    const message = `Join me on ADES and start earning! Use my referral link: ${referralLink}`;
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        referralLink
      )}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        message
      )}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(
        referralLink
      )}&text=${encodeURIComponent(message)}`,
      instagram: `https://www.instagram.com/`,
      tiktok: `https://www.tiktok.com/`,
      youtube: `https://www.youtube.com/`,
    };
    window.open(urls[platform as keyof typeof urls], '_blank');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/');
  };

  const currentMedia = getCurrentAd();
  const currentFilteredAds = getAvailableFilteredAds();
  const displayAd =
    currentFilteredAds.find((ad) => ad.id === currentMedia?.id) ||
    currentFilteredAds[0];

  if (loading) return <Loader />;

  return (
    <div
      className={`min-h-screen px-4 ${
        isDark ? 'bg-slate-900' : 'bg-slate-50'
      } transition-all duration-300`}
    >
      <header
        className={`${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        } border-b sticky top-0 z-40`}
      >
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center justify-center w-10 h-10 lg:h-12 lg:w-12 rounded-xl">
              <img
                src="/FAD-Logo.png"
                alt="FAD"
                className="object-contain w-6 h-6 lg:h-12 lg:w-12"
              />
            </div>
            <div className="hidden sm:block">
              <h1
                className={`font-bold text-base lg:text-lg ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Followers Advertisement Platform
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => setIsReferralOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-all rounded-lg lg:px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Refer</span>
            </button>
            <button
              onClick={() => setIsWalletOpen(true)}
              className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-medium transition-all border text-sm ${
                isDark
                  ? 'bg-slate-700 text-white hover:bg-slate-600 border-slate-600'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Wallet</span>
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-all ${
                isDark
                  ? 'bg-slate-700 text-white hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                isDark
                  ? 'bg-red-900 text-red-100 hover:bg-red-800'
                  : 'bg-red-100 text-red-900 hover:bg-red-200'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 lg:p-6 lg:grid-cols-12 lg:gap-6">
        {/* Left Column - Stats */}
        <div className="space-y-4 lg:col-span-3">
          <div
            className={`${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            } border rounded-xl p-4`}
          >
            <h2
              className={`text-lg font-bold mb-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Welcome, {userDetails?.name}! 👋
            </h2>
            <p className="text-xs text-gray-600">{userDetails?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div
              className={`${
                isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
              } border rounded-xl p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Current Balance
                  </p>
                  <p
                    className={`text-xl lg:text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {userDetails?.current_balance}
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 bg-gradient-to-br from-indigo-600 to-purple-600">
                  <DollarSign className="w-5 h-5 text-white lg:h-6 lg:w-6" />
                </div>
              </div>
            </div>

            <div
              className={`${
                isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
              } border rounded-xl p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Total Earned
                  </p>
                  <p
                    className={`text-xl lg:text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {userDetails?.total_earned}
                  </p>
                </div>
                <div
                  className={`h-10 w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-slate-700' : 'bg-slate-100'
                  }`}
                >
                  <TrendingUp
                    className={`h-5 w-5 lg:h-6 lg:w-6 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>
            <div
              className={`${
                isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
              } border rounded-xl p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Total Watched
                  </p>
                  <p
                    className={`text-xl lg:text-2xl font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {userDetails?.ads_watched_count}
                  </p>
                </div>
                <div
                  className={`h-10 w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-slate-700' : 'bg-slate-100'
                  }`}
                >
                  <Eye
                    className={`h-5 w-5 lg:h-6 lg:w-6 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column - Ad Watching */}
        <div className="lg:col-span-6 ">
          <div
            className={`${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            } border rounded-xl p-4 lg:p-6 lg:h-[80vh]`}
          >
            <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Play
                  className={`h-5 w-5 lg:h-6 lg:w-6 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                />
                <h3
                  className={`text-lg lg:text-xl font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Watch Ads & Earn
                </h3>
              </div>

              <div className="flex items-center w-full gap-2 sm:w-auto">
                <button
                  onClick={() => setAdFilter('all')}
                  className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none ${
                    adFilter === 'all'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAdFilter('video')}
                  className={`px-3 lg:px-4 py-2  rounded-lg text-sm font-medium transition-all flex items-center gap-2 flex-1 sm:flex-none ${
                    adFilter === 'video'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  <span className="inline">Video</span>
                </button>
                <button
                  onClick={() => setAdFilter('image')}
                  className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 flex-1 sm:flex-none ${
                    adFilter === 'image'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="inline">Image</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col h-full">
              {currentFilteredAds.length === 0 ? (
                <div className="w-full max-w-screen-sm mx-auto bg-blue-100">
                  <div className="relative" style={{ paddingTop: '65%' }}>
                    <iframe
                      src="https://funhtml5games.com?embed=flappy"
                      className="absolute top-0 left-0 w-full h-full border-0"
                      scrolling="no"
                    ></iframe>
                  </div>
                </div>
              ) : displayAd ? (
                <div className="flex flex-col flex-1">
                  <div className="relative mb-6 overflow-hidden aspect-video rounded-xl bg-slate-900">
                    {displayAd.ad_type === 'video' ? (
                      <>
                        <video
                          ref={videoRef}
                          src={
                            import.meta.env.VITE_BACKEND_URL +
                            displayAd.content_url
                          }
                          className="object-cover w-full h-full"
                          onClick={togglePlay}
                          onLoadedMetadata={() => {
                            if (videoRef.current) {
                              setDuration(videoRef.current.duration);
                            }
                          }}
                        />

                        {/* Video Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <button
                              onClick={togglePlay}
                              className="text-white transition-colors hover:text-indigo-400"
                            >
                              {isPlaying ? (
                                <Pause className="w-5 h-5" />
                              ) : (
                                <Play className="w-5 h-5" />
                              )}
                            </button>

                            {/* <div className="flex-1">
                              <input
                                type="range"
                                min="0"
                                max={duration}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1 rounded-lg appearance-none cursor-pointer bg-white/30 slider"
                              />
                            </div>

                            <span className="text-sm text-white">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span> */}

                            <button
                              onClick={toggleMute}
                              className="text-white transition-colors hover:text-indigo-400"
                            >
                              {isMuted ? (
                                <VolumeX className="w-5 h-5" />
                              ) : (
                                <Volume2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={
                          import.meta.env.VITE_BACKEND_URL +
                          displayAd.content_url
                        }
                        alt={displayAd.title}
                        className="object-cover w-full h-full cursor-pointer"
                        onClick={() => !isViewing && startViewing()}
                      />
                    )}
                  </div>

                  <div className="flex justify-center">
                    <div>
                      {isViewing ? (
                        <div className="text-center">
                          {timerCompleted ? (
                            <div>
                              <button
                                onClick={proceedToNext}
                                className="flex items-center justify-center gap-2 px-8 py-3 mx-auto font-medium text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700"
                              >
                                <ArrowRight className="w-5 h-5" />
                                Next Ad
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <Timer
                                  className={`h-5 w-5 ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                  }`}
                                />
                                <span
                                  className={`text-lg font-bold ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                  }`}
                                >
                                  {timerCompleted
                                    ? 'Timer Complete!'
                                    : `${15 - viewTimer}s remaining`}
                                </span>
                              </div>
                              <div
                                className={`w-full rounded-full h-1 ${
                                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                                }`}
                              >
                                <div
                                  className="h-1 transition-all duration-1000 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                  style={{
                                    width: `${(viewTimer / 15) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <p
                                className={`text-xs mt-2 ${
                                  isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}
                              >
                                Keep watching to earn ADES!
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <button
                            onClick={startViewing}
                            className="flex items-center justify-center gap-2 px-8 py-3 mx-auto font-medium text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700"
                          >
                            <Play className="w-5 h-5" />
                            Start Watching (15s)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto text-center">
                    <p
                      className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Showing{' '}
                      {adFilter === 'all' ? 'all ads' : `${adFilter} ads`} •{' '}
                      {currentFilteredAds.length} available
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center">
                    <div
                      className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}
                    >
                      <Filter
                        className={`h-8 w-8 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                    <p
                      className={`font-medium ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      No ads available
                    </p>
                    <p
                      className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      Try changing the filter
                    </p>
                  </div>
                </div>
              )}
              {filteredAds.length === 0 && (
                <span className="py-1 text-xs text-center text-gray-700">
                  No Ads Left for Today. Play Games
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Referrals Activity */}
        <div className="space-y-4 lg:col-span-3">
          <div
            className={`${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            } border rounded-xl p-4`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Gift
                className={`h-5 w-5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              />
              <h3
                className={`text-lg font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Referral History
              </h3>
            </div>
            <div className="space-y-3">
              {referrals && referrals.length > 0 ? (
                referrals.map((referral, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-slate-700' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600">
                        <Gift className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p
                          className={`font-medium text-sm ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          Referrals
                        </p>
                        <p
                          className={`text-xs ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {referral.new_user.email}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center space-x-1 text-sm font-bold text-purple-600">
                      <span>
                        {Number(referral.earned_amount).toFixed(2) || 0}{' '}
                      </span>
                      <span className="text-xs">ADES</span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-gray-700">
                  No referrals found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isWalletOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            } border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Your Wallet
              </h3>
              <button
                onClick={() => setIsWalletOpen(false)}
                className={`${
                  isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                } text-xl`}
              >
                ✕
              </button>
            </div>

            <div className="p-6 mb-6 text-center text-white bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              <p className="text-3xl font-bold">
                {userDetails?.total_earned || 0}
              </p>
              <p className="text-indigo-100">ADES Balance</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className={`text-center p-4 rounded-lg ${
                  isDark ? 'bg-slate-700' : 'bg-slate-100'
                }`}
              >
                <p
                  className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {userDetails?.current_balance}
                </p>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Current Balance
                </p>
              </div>
              <div
                className={`text-center p-4 rounded-lg ${
                  isDark ? 'bg-slate-700' : 'bg-slate-100'
                }`}
              >
                <p
                  className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {userDetails?.referals_earned || 0}
                </p>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  From Referrals
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleRequestPayment('esewa')}
                className={`w-full rounded-lg p-4 flex items-center gap-3 transition-all border ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-red-600" />
                <span className="font-medium">Withdraw to eSewa</span>
              </button>
              <button
                onClick={() => handleRequestPayment('khalti')}
                className={`w-full rounded-lg p-4 flex items-center gap-3 transition-all border ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-white'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Withdraw to Khalti</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isReferralOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-200'
            } border rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-xl font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Refer & Earn
              </h3>
              <button
                onClick={() => setIsReferralOpen(false)}
                className={`${
                  isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                } text-xl`}
              >
                ✕
              </button>
            </div>

            <div
              className={`p-4 rounded-lg mb-6 ${
                isDark ? 'bg-slate-700' : 'bg-slate-100'
              }`}
            >
              <p
                className={`text-sm font-medium mb-3 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Your Referral Link
              </p>
              <div className="flex items-center gap-2">
                <code
                  className={`flex-1 p-3 rounded text-xs ${
                    isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  {referralLink}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="p-3 text-white transition-all rounded bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <p
                className={`text-sm font-medium ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Share on Social Media
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={() => shareToSocial('instagram')}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all bg-pink-600 rounded-lg hover:bg-pink-700"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </button>
                <button
                  onClick={() => shareToSocial('tiktok')}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all rounded-lg bg-slate-900 hover:bg-slate-800"
                >
                  <Video className="w-4 h-4" />
                  TikTok
                </button>
                <button
                  onClick={() => shareToSocial('youtube')}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white transition-all bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <Play className="w-4 h-4" />
                  YouTube
                </button>
              </div>
            </div>

            <div className="p-4 text-white rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Total Referrals</p>
                  <p className="text-2xl font-bold">{referrals?.length || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-100">Earned</p>
                  <p className="font-bold">
                    {userDetails?.referals_earned} ADES
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
