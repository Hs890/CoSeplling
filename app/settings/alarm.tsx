// Alarm feature is completely disabled
import { Redirect } from 'expo-router';

export default function AlarmSettings() {
  return <Redirect href="/(tabs)/settings" />;
}
