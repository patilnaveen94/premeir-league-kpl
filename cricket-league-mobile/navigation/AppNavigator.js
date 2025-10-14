import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import TeamsScreen from '../screens/TeamsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import PointsTableScreen from '../screens/PointsTableScreen';
import NewsScreen from '../screens/NewsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PlayerRegistrationScreen from '../screens/PlayerRegistrationScreen';

import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Teams') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Schedule') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Table') {
          iconName = focused ? 'trophy' : 'trophy-outline';
        } else if (route.name === 'News') {
          iconName = focused ? 'newspaper' : 'newspaper-outline';
        }
        
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#37003c',
      tabBarInactiveTintColor: 'gray',
      headerStyle: {
        backgroundColor: '#37003c',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Teams" component={TeamsScreen} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} />
    <Tab.Screen name="Table" component={PointsTableScreen} />
    <Tab.Screen name="News" component={NewsScreen} />
  </Tab.Navigator>
);

const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="PlayerRegistration" 
      component={PlayerRegistrationScreen}
      options={{
        title: 'Player Registration',
        headerStyle: { backgroundColor: '#37003c' },
        headerTintColor: '#fff',
      }}
    />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { currentUser } = useAuth();
  
  return (
    <NavigationContainer>
      {currentUser ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}