import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { keepAwake, allowSleep } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Path, Text as SvgText, Line } from 'react-native-svg';

const LOCATION_TASK_NAME = 'background-location-task';
const STORAGE_KEY = '@cartographia_path';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Tâche en arrière-plan pour le tracking GPS
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      // Sauvegarder la position
      try {
        const pathJson = await AsyncStorage.getItem(STORAGE_KEY);
        const path = pathJson ? JSON.parse(pathJson) : [];
        
        path.push({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || 0,
          timestamp: location.timestamp,
        });
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(path));
        
        // Notification de progression
        if (path.length % 10 === 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🗺️ Cartographia',
              body: `${path.length} points cartographiés`,
              data: { path: path.length },
            },
            trigger: null,
          });
        }
      } catch (err) {
        console.error('Error saving location:', err);
      }
    }
  }
});

export default function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [path, setPath] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const locationSubscription = useRef(null);

  // Charger le parcours sauvegardé au démarrage
  useEffect(() => {
    loadSavedPath();
    checkPermissions();
    requestNotificationPermissions();
  }, []);

  // Garder l'écran allumé pendant le tracking
  useEffect(() => {
    if (isTracking) {
      keepAwake();
    } else {
      allowSleep();
    }
  }, [isTracking]);

  const loadSavedPath = async () => {
    try {
      const pathJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (pathJson) {
        const savedPath = JSON.parse(pathJson);
        setPath(savedPath);
        calculateDistance(savedPath);
      }
    } catch (error) {
      console.error('Error loading path:', error);
    }
  };

  const checkPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus === 'granted') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      setPermissionStatus(backgroundStatus);
    } else {
      setPermissionStatus(foregroundStatus);
    }
  };

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Notifications', 'Les notifications vous permettront de suivre votre progression.');
    }
  };

  const calculateDistance = (pathData) => {
    if (pathData.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < pathData.length; i++) {
      const lat1 = pathData[i - 1].latitude;
      const lon1 = pathData[i - 1].longitude;
      const lat2 = pathData[i].latitude;
      const lon2 = pathData[i].longitude;
      
      totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
    }
    setDistance(totalDistance);
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const startTracking = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Cette app a besoin d\'accéder à votre position en arrière-plan pour tracer votre parcours.',
        [{ text: 'OK', onPress: checkPermissions }]
      );
      return;
    }

    try {
      // Démarrer le tracking en arrière-plan
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Mise à jour toutes les 5 secondes
        distanceInterval: 10, // Ou tous les 10 mètres
        foregroundService: {
          notificationTitle: '🗺️ Cartographia Active',
          notificationBody: 'Tracking de votre parcours en cours...',
          notificationColor: '#d4c5a9',
        },
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
      });

      // Tracking en premier plan aussi
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (location) => {
          setCurrentLocation(location.coords);
          
          const newPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || 0,
            timestamp: location.timestamp,
          };
          
          setPath(prevPath => {
            const updatedPath = [...prevPath, newPoint];
            calculateDistance(updatedPath);
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPath));
            return updatedPath;
          });
        }
      );

      setIsTracking(true);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚓ Exploration Démarrée',
          body: 'Votre parcours est maintenant tracé en arrière-plan !',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Erreur', 'Impossible de démarrer le tracking GPS');
    }
  };

  const stopTracking = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      
      setIsTracking(false);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏸ Exploration en Pause',
          body: `${path.length} points cartographiés`,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const clearPath = () => {
    Alert.alert(
      'Nouvelle Expédition',
      'Effacer toute la carte et recommencer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await stopTracking();
            setPath([]);
            setDistance(0);
            setCurrentLocation(null);
            await AsyncStorage.removeItem(STORAGE_KEY);
          },
        },
      ]
    );
  };

  const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const renderCompass = () => (
    <View style={styles.compass}>
      <Svg width={80} height={80} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="48" fill="#f5ead8" stroke="#3a2817" strokeWidth="2"/>
        <Path d="M 50 10 L 55 45 L 50 40 L 45 45 Z" fill="#8b3a3a" stroke="#3a2817" strokeWidth="1"/>
        <SvgText x="50" y="12" textAnchor="middle" fontSize="10" fill="#3a2817" fontWeight="bold">N</SvgText>
        <Circle cx="50" cy="50" r="4" fill="#3a2817"/>
      </Svg>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3a2817" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚜ Cartographia ⚜</Text>
        <Text style={styles.subtitle}>Exploratoria</Text>
      </View>

      {/* Zone de carte */}
      <View style={styles.mapContainer}>
        <View style={styles.mapFrame}>
          {path.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Terra Incognita</Text>
              <Text style={styles.emptySubtext}>Commencez votre exploration</Text>
            </View>
          ) : (
            <View style={styles.mapContent}>
              <Text style={styles.pathInfo}>
                📍 {path.length} points cartographiés
              </Text>
              {currentLocation && (
                <View style={styles.currentPos}>
                  <Text style={styles.coordText}>
                    {currentLocation.latitude.toFixed(6)}°, {currentLocation.longitude.toFixed(6)}°
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        {renderCompass()}

        {/* Bouton Info */}
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowInfo(!showInfo)}
        >
          <Text style={styles.infoButtonText}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Panneau d'informations */}
      {showInfo && (
        <View style={styles.infoPanel}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowInfo(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.infoPanelTitle}>📜 Journal de Bord</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Points</Text>
              <Text style={styles.infoValue}>{path.length}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{formatDistance(distance)}</Text>
            </View>
            
            {currentLocation && (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Latitude</Text>
                  <Text style={styles.infoValue}>{currentLocation.latitude.toFixed(6)}°</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Longitude</Text>
                  <Text style={styles.infoValue}>{currentLocation.longitude.toFixed(6)}°</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Altitude</Text>
                  <Text style={styles.infoValue}>{Math.round(currentLocation.altitude || 0)} m</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Précision</Text>
                  <Text style={styles.infoValue}>±{Math.round(currentLocation.accuracy || 0)} m</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Contrôles */}
      <View style={styles.controls}>
        <View style={styles.controlsMain}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={startTracking}
            >
              <Text style={styles.buttonText}>⚓ Commencer l'Exploration</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonWarning]}
              onPress={stopTracking}
            >
              <Text style={styles.buttonText}>⏸ Pause</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={clearPath}
            disabled={path.length === 0}
          >
            <Text style={styles.buttonText}>🗑 Nouvelle Carte</Text>
          </TouchableOpacity>
        </View>

        {isTracking && (
          <View style={styles.statusBar}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Tracking actif en arrière-plan</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8dcc4',
  },
  header: {
    backgroundColor: '#3a2817',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f5ead8',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#d4c5a9',
    letterSpacing: 1,
    marginTop: 4,
  },
  mapContainer: {
    flex: 1,
    padding: 15,
  },
  mapFrame: {
    flex: 1,
    backgroundColor: '#f5ead8',
    borderWidth: 4,
    borderColor: '#3a2817',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32,
    fontStyle: 'italic',
    color: 'rgba(58, 40, 23, 0.2)',
  },
  emptySubtext: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    color: 'rgba(58, 40, 23, 0.3)',
    marginTop: 10,
  },
  mapContent: {
    flex: 1,
    padding: 20,
  },
  pathInfo: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    color: '#3a2817',
    fontWeight: 'bold',
  },
  currentPos: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(58, 40, 23, 0.1)',
    borderRadius: 5,
  },
  coordText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#5a4a3a',
  },
  compass: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  infoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3a2817',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  infoButtonText: {
    fontSize: 28,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(245, 234, 216, 0.98)',
    borderTopWidth: 3,
    borderTopColor: '#3a2817',
    padding: 20,
    paddingTop: 30,
    maxHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5a4530',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#f5ead8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoPanelTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3a2817',
    marginBottom: 15,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#8b7557',
    paddingBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d4c5a9',
  },
  infoLabel: {
    fontSize: 12,
    color: '#5a4a3a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#3a2817',
    fontWeight: 'bold',
    marginTop: 4,
  },
  controls: {
    backgroundColor: '#3a2817',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  controlsMain: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonPrimary: {
    backgroundColor: '#3a7a5a',
  },
  buttonWarning: {
    backgroundColor: '#8b6a3a',
  },
  buttonSecondary: {
    backgroundColor: '#5a4530',
  },
  buttonText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#f5ead8',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 234, 216, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3a7a5a',
    marginRight: 8,
  },
  statusText: {
    color: '#d4c5a9',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
