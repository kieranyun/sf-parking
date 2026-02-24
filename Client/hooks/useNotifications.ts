import { PushNotificationData } from '@/app/types';
import { useParking } from '@/contexts/ParkingContext';
import apiFetch from '@/services/api-client';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';


// Hardcoded for now — device's IMEI
const DEVICE_ID = '7018523442';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Hook that registers for push notifications on app startup
 * and handles incoming data pushes to update parking state.
 *
 * Must be called inside ParkingProvider.
 */
export function useNotifications() {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const { setParked, clearParked } = useParking();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        setPushToken(token);
        // Send token to backend
        sendTokenToBackend(token);
      }
    });

    // Listener for when a notification is received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);

      const data = notification.request.content.data as PushNotificationData;
      if (data?.type === 'parked') {
        console.log('Data push: car parked at', data.latitude, data.longitude);
        setParked({
          latitude: data.latitude,
          longitude: data.longitude,
          restrictions: data.restrictions ?? [],
        });
      } else if (data?.type === 'unparked') {
        console.log('Data push: car unparked');
        clearParked();
      }
    });

    // Listener for when user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // Could navigate to map or show details here
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [setParked, clearParked]);

  return pushToken;
}

async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  console.log('Push token:', tokenData.data);

  return tokenData.data;
}

async function sendTokenToBackend(pushToken: string): Promise<void> {
  try {
    await apiFetch('/api/register-push-token', {
      method: 'POST',
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        pushToken,
      }),
    });
    console.log('Push token registered with backend');
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}
