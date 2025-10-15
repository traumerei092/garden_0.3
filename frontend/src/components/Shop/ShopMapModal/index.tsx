'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Button } from '@nextui-org/react';
import { MapPin, ExternalLink, Copy, Loader2 } from 'lucide-react';
import CustomModal from '@/components/UI/Modal';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import { Shop } from '@/types/shops';
import { showToast } from '@/utils/toasts';
import styles from './style.module.scss';

// Google Maps型定義の拡張
declare global {
  interface Window {
    google: typeof google;
  }
}

interface ShopMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
}

interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  shop: Shop;
}

const MapComponent: React.FC<MapProps> = ({ center, zoom, shop }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        styles: [
          {
            "featureType": "all",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "weight": "2.00"
              }
            ]
          },
          {
            "featureType": "all",
            "elementType": "geometry.stroke",
            "stylers": [
              {
                "color": "#9c9c9c"
              }
            ]
          },
          {
            "featureType": "all",
            "elementType": "labels.text",
            "stylers": [
              {
                "visibility": "on"
              }
            ]
          },
          {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [
              {
                "color": "#0f1419"
              }
            ]
          },
          {
            "featureType": "landscape",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "color": "#0f1419"
              }
            ]
          },
          {
            "featureType": "landscape.man_made",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "color": "#0f1419"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [
              {
                "color": "#0f1419"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "all",
            "stylers": [
              {
                "color": "#000000"
              }
            ]
          },
          {
            "featureType": "road.arterial",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "color": "#000000"
              }
            ]
          },
          {
            "featureType": "road.local",
            "elementType": "geometry.fill",
            "stylers": [
              {
                "color": "#000000"
              }
            ]
          },
          {
            "featureType": "water",
            "elementType": "all",
            "stylers": [
              {
                "color": "#00c6ff"
              }
            ]
          }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: false,
        fullscreenControl: true
      });

      setMap(newMap);
    }
  }, [ref, map, center, zoom]);

  useEffect(() => {
    if (map && shop.latitude && shop.longitude) {
      // カスタムマーカーを作成
      const marker = new window.google.maps.Marker({
        position: { lat: shop.latitude, lng: shop.longitude },
        map: map,
        title: shop.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#00c6ff',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      // インフォウィンドウを作成
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; color: #000; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; font-weight: bold;">${shop.name}</h3>
            <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${shop.address || '住所情報なし'}</p>
          </div>
        `
      });

      // マーカークリックでインフォウィンドウを表示
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // クリーンアップ
      return () => {
        marker.setMap(null);
      };
    }
  }, [map, shop]);

  return <div ref={ref} className={styles.map} />;
};

const ShopMapModal: React.FC<ShopMapModalProps> = ({ isOpen, onClose, shop }) => {

  const center = React.useMemo(() => ({
    lat: shop.latitude || 35.6762,
    lng: shop.longitude || 139.6503,
  }), [shop.latitude, shop.longitude]);

  const renderMap = useCallback((status: Status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className={styles.loadingContainer}>
            <Loader2 className={styles.loadingIcon} />
            <p className={styles.loadingText}>地図を読み込み中...</p>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className={styles.errorContainer}>
            <MapPin className={styles.errorIcon} />
            <p className={styles.errorText}>地図の読み込みに失敗しました</p>
          </div>
        );
      case Status.SUCCESS:
        return (
          <MapComponent
            center={center}
            zoom={17}
            shop={shop}
          />
        );
      default:
        return <div></div>;
    }
  }, [center, shop]);

  const handleOpenGoogleMaps = () => {
    const query = encodeURIComponent(`${shop.name} ${shop.address || ''}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  const handleCopyAddress = async () => {
    if (shop.address) {
      try {
        await navigator.clipboard.writeText(shop.address);
        showToast('住所をコピーしました', 'success');
      } catch (error) {
        showToast('住所のコピーに失敗しました', 'error');
      }
    }
  };


  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="店舗の場所"
      size="4xl"
    >
      <div className={styles.modalContent}>
        {/* 店舗情報ヘッダー */}
        <div className={styles.shopHeader}>
          <div className={styles.shopInfo}>
            <h2 className={styles.shopName}>{shop.name}</h2>
            {shop.address && (
              <div className={styles.addressContainer}>
                <MapPin className={styles.addressIcon} strokeWidth={1} />
                <span className={styles.address}>{shop.address}</span>
                <Button
                  onPress={handleCopyAddress}
                  className={styles.copyButton}
                  variant="light"
                >
                  <Copy size={16} strokeWidth={1} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 地図エリア */}
        <div className={styles.mapContainer}>
          <Wrapper
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            render={renderMap}
            libraries={['places']}
          />
        </div>

        {/* アクションボタン */}
        <div className={styles.actionButtons}>
          <ButtonGradientWrapper
            onClick={handleOpenGoogleMaps}
            anotherStyle={styles.actionButton}
          >
            <ExternalLink size={18} strokeWidth={1} />
            <span>Google Mapsで開く</span>
          </ButtonGradientWrapper>
        </div>
      </div>
    </CustomModal>
  );
};

export default ShopMapModal;