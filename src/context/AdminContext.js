import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';

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
      const q = query(
        collection(db, 'adminUsers'), 
        where('userid', '==', userid),
        where('password', '==', password),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const adminData = { 
          userid, 
          id: doc.id, 
          role: doc.data().role || 'admin'
        };
        setCurrentAdmin(adminData);
        setIsAdminLoggedIn(true);
        localStorage.setItem('adminSession', JSON.stringify(adminData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const adminLogout = () => {
    setCurrentAdmin(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem('adminSession');
  };

  const value = {
    isAdminLoggedIn,
    currentAdmin,
    adminLogin,
    adminLogout
  };

  return (
    <AdminContext.Provider value={value}>
      {!loading && children}
    </AdminContext.Provider>
  );
};