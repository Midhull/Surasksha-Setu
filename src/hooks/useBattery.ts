import { useState, useEffect } from 'react';

export function useBattery() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  useEffect(() => {
    if (!('getBattery' in navigator)) return;

    (navigator as any).getBattery().then((battery: any) => {
      const updateBattery = () => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
      };

      updateBattery();

      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);

      return () => {
        battery.removeEventListener('levelchange', updateBattery);
        battery.removeEventListener('chargingchange', updateBattery);
      };
    });
  }, []);

  return { batteryLevel, isCharging };
}
