import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Colors } from './theme';

// Screens
import AuthScreen from './screens/AuthScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import BookingFlowScreen from './screens/BookingFlowScreen';
import AddItemScreen from './screens/AddItemScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import InboxScreen from './screens/InboxScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme: { c } } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let name;
          if (route.name === 'Discover') name = 'compass';
          else if (route.name === 'Bookings') name = 'calendar';
          else if (route.name === 'Add Item') name = 'add-circle';
          else if (route.name === 'Inbox') name = 'chatbubbles';
          else if (route.name === 'Profile') name = 'person';
          else if (route.name === 'Admin') name = 'shield-half';

          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: c.tabBar,
          borderBottomColor: c.border,
          borderBottomWidth: 1,
        },
        headerTintColor: c.text,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="Bookings" component={BookingFlowScreen} options={{ title: 'My Bookings' }} />
      <Tab.Screen name="Add Item" component={AddItemScreen} options={{ title: 'List an Item' }} />
      <Tab.Screen name="Inbox" component={InboxScreen} options={{ title: 'RentNest Inbox' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Tab.Screen name="Admin" component={AdminScreen} options={{ title: 'Supervisor Console' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme: { c } } = useTheme();

  if (loading) {
    return null; // safe state loading bypass
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: c.tabBar,
          borderBottomColor: c.border,
        },
        headerTintColor: c.text,
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}
    >
      {!user ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ItemDetail"
            component={ItemDetailScreen}
            options={{
              title: 'Item Detail',
              headerTransparent: true,
              headerTintColor: '#FFF',
              headerTitle: '',
              headerStyle: { backgroundColor: 'transparent' }
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatDetailScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
