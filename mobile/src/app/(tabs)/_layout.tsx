import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '@/lib/theme';
import { useNotificationCount } from '@/hooks/use-notification-count';

const contentStyle = { backgroundColor: colors.paper };

export default function TabsLayout() {
  const { chatNotifications } = useNotificationCount(true);
  return <NativeTabs tintColor={colors.moss} labelStyle={{ color: colors.mossDeep }}>
    <NativeTabs.Trigger name="index" contentStyle={contentStyle} disableTransparentOnScrollEdge>
      <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md={{ default: 'home', selected: 'home_filled' }} />
      <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="friends" contentStyle={contentStyle} disableTransparentOnScrollEdge>
      <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md={{ default: 'group', selected: 'group' }} />
      <NativeTabs.Trigger.Label>Friends</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="add" contentStyle={contentStyle} disableTransparentOnScrollEdge>
      <NativeTabs.Trigger.Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} md={{ default: 'add_circle', selected: 'add_circle' }} />
      <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="messages" contentStyle={contentStyle} disableTransparentOnScrollEdge>
      <NativeTabs.Trigger.Icon sf={{ default: 'message', selected: 'message.fill' }} md={{ default: 'chat_bubble', selected: 'chat_bubble' }} />
      <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
      {chatNotifications ? <NativeTabs.Trigger.Badge>{chatNotifications > 9 ? '9+' : String(chatNotifications)}</NativeTabs.Trigger.Badge> : null}
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="journal" contentStyle={contentStyle} disableTransparentOnScrollEdge>
      <NativeTabs.Trigger.Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} md={{ default: 'book', selected: 'book' }} />
      <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
