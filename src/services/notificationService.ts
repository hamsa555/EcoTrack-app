export type NotificationType = 'reminder' | 'challenge' | 'impact' | 'social';

export interface EcoNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

class NotificationService {
  private listeners: ((notifications: EcoNotification[]) => void)[] = [];
  private notifications: EcoNotification[] = [
    {
      id: '1',
      type: 'impact',
      title: 'Weekly Summary',
      body: 'You saved 12kg of CO2 this week! Higher than 80% of users.',
      timestamp: new Date(Date.now() - 3600000),
      read: false
    },
    {
      id: '2',
      type: 'social',
      title: 'New Clap!',
      body: 'Alex clapped for your recycling activity.',
      timestamp: new Date(Date.now() - 7200000),
      read: false
    }
  ];

  subscribe(listener: (notifications: EcoNotification[]) => void) {
    this.listeners.push(listener);
    listener(this.notifications);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.notifications]));
  }

  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  send(title: string, body: string, type: NotificationType = 'reminder') {
    const notification: EcoNotification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      body,
      timestamp: new Date(),
      read: false
    };

    this.notifications = [notification, ...this.notifications];
    this.notify();

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (e) {
        console.error("OS notification failed", e);
      }
    }
  }

  markAsRead(id: string) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.notify();
  }

  clearAll() {
    this.notifications = [];
    this.notify();
  }
}

export const notificationService = new NotificationService();
