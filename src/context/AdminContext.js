import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { testDatabaseConnection } from '../utils/dbTest';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminData = localStorage.getItem('adminSession');
    if (adminData) {
      setCurrentAdmin(JSON.parse(adminData));
      setIsAdminLoggedIn(true);
    }
    setLoading(false);
    initializeDefaultAdmin();
  }, []);

  const initializeDefaultAdmin = async () => {
    try {
      const q = query(collection(db, 'adminUsers'), where('userid', '==', 'naveenpatil'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'adminUsers'), {
          userid: 'naveenpatil',
          password: 'test1234',
          role: 'superuser',
          createdAt: new Date(),
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  };

  const adminLogin = async (userid, password) => {
    try {
      console.log('🔐 Admin login attempt:', { userid, password });
      
      // Temporary hardcoded login for debugging
      if (userid === 'naveenpatil' && password === 'test1234') {
        const adminData = { 
          userid: 'naveenpatil', 
          id: 'temp-id', 
          role: 'superuser'
        };
        setCurrentAdmin(adminData);
        setIsAdminLoggedIn(true);
        localStorage.setItem('adminSession', JSON.stringify(adminData));
        console.log('✅ Hardcoded login successful');
        return true;
      }
      
      // Get all admin users
      const allAdminsSnapshot = await getDocs(collection(db, 'adminUsers'));
      const allAdmins = allAdminsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('📋 All admin users:', allAdmins);
      
      // Find matching user
      const matchingUser = allAdmins.find(user => 
        user.userid === userid && user.password === password
      );
      
      if (matchingUser) {
        const adminData = { 
          userid, 
          id: matchingUser.id, 
          role: matchingUser.role || 'admin'
        };
        setCurrentAdmin(adminData);
        setIsAdminLoggedIn(true);
        localStorage.setItem('adminSession', JSON.stringify(adminData));
        console.log('✅ Database login successful');
        return true;
      }
      
      console.log('❌ No matching user found');
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const adminLogout = () => {
    setCurrentAdmin(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('adminSession');
  };

  const testDB = async () => {
    const result = await testDatabaseConnection();
    console.log('Database test result:', result);
    return result;
  };

  const value = {
    isAdminLoggedIn,
    currentAdmin,
    adminLogin,
    adminLogout,
    testDB
  };

  return (
    <AdminContext.Provider value={value}>
      {!loading && children}
    </AdminContext.Provider>
  );
};