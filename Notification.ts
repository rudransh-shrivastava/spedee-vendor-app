import PushNotification from 'react-native-push-notification';

const LocalNotification = (title: string, message: string) => {
  const key = Date.now().toString(); // Key must be unique everytime
  PushNotification.createChannel(
    {
      channelId: key, // (required)
      channelName: title, // (required)
      channelDescription: message, // (optional) default: undefined.
      importance: 4, // (optional) default: 4. Int value of the Android notification importance
      vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
    },
    (created: any) => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
  );
  PushNotification.localNotification({
    channelId: key, //this must be same as channelid in createchannel
    title: title,
    message: message,
  });
};

export default LocalNotification;
