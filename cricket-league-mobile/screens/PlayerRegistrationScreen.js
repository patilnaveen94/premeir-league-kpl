import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';

const PlayerRegistrationScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: currentUser?.email || '',
    phone: '',
    dateOfBirth: '',
    address: '',
    position: '',
    battingStyle: '',
    bowlingStyle: '',
    experience: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    previousTeams: '',
  });
  const [loading, setLoading] = useState(false);

  const positions = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
  const battingStyles = ['Right-handed', 'Left-handed'];
  const bowlingStyles = ['Right-arm Fast', 'Left-arm Fast', 'Right-arm Spin', 'Left-arm Spin', 'None'];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['fullName', 'phone', 'dateOfBirth', 'address', 'position', 'battingStyle', 'emergencyContact', 'emergencyPhone'];
    
    for (let field of required) {
      if (!formData[field].trim()) {
        Alert.alert('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }

    if (!/^\d{10}$/.test(formData.emergencyPhone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit emergency phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'playerRegistrations'), {
        ...formData,
        userId: currentUser?.uid,
        status: 'pending',
        submittedAt: new Date(),
      });

      Alert.alert(
        'Success',
        'Your registration has been submitted successfully! You will be notified once it is reviewed.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting registration:', error);
      Alert.alert('Error', 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const SelectField = ({ label, value, onSelect, options }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionButton, value === option && styles.selectedOption]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.optionText, value === option && styles.selectedOptionText]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="person-add" size={40} color="#37003c" />
          <Text style={styles.title}>Player Registration</Text>
          <Text style={styles.subtitle}>Join the Cricket League</Text>
        </View>

        <InputField
          label="Full Name *"
          value={formData.fullName}
          onChangeText={(value) => updateFormData('fullName', value)}
          placeholder="Enter your full name"
        />

        <InputField
          label="Email"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          placeholder="Enter your email"
          keyboardType="email-address"
        />

        <InputField
          label="Phone Number *"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
          placeholder="Enter 10-digit phone number"
          keyboardType="phone-pad"
        />

        <InputField
          label="Date of Birth *"
          value={formData.dateOfBirth}
          onChangeText={(value) => updateFormData('dateOfBirth', value)}
          placeholder="DD/MM/YYYY"
        />

        <InputField
          label="Address *"
          value={formData.address}
          onChangeText={(value) => updateFormData('address', value)}
          placeholder="Enter your complete address"
          multiline
        />

        <SelectField
          label="Playing Position *"
          value={formData.position}
          onSelect={(value) => updateFormData('position', value)}
          options={positions}
        />

        <SelectField
          label="Batting Style *"
          value={formData.battingStyle}
          onSelect={(value) => updateFormData('battingStyle', value)}
          options={battingStyles}
        />

        <SelectField
          label="Bowling Style"
          value={formData.bowlingStyle}
          onSelect={(value) => updateFormData('bowlingStyle', value)}
          options={bowlingStyles}
        />

        <InputField
          label="Cricket Experience"
          value={formData.experience}
          onChangeText={(value) => updateFormData('experience', value)}
          placeholder="Describe your cricket experience"
          multiline
        />

        <InputField
          label="Previous Teams"
          value={formData.previousTeams}
          onChangeText={(value) => updateFormData('previousTeams', value)}
          placeholder="List any previous teams you've played for"
          multiline
        />

        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <InputField
          label="Emergency Contact Name *"
          value={formData.emergencyContact}
          onChangeText={(value) => updateFormData('emergencyContact', value)}
          placeholder="Enter emergency contact name"
        />

        <InputField
          label="Emergency Contact Phone *"
          value={formData.emergencyPhone}
          onChangeText={(value) => updateFormData('emergencyPhone', value)}
          placeholder="Enter 10-digit phone number"
          keyboardType="phone-pad"
        />

        <InputField
          label="Medical Conditions"
          value={formData.medicalConditions}
          onChangeText={(value) => updateFormData('medicalConditions', value)}
          placeholder="Any medical conditions we should know about"
          multiline
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            * Required fields. Your registration will be reviewed by the admin team.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#37003c',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37003c',
    marginTop: 20,
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37003c',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#37003c',
    borderColor: '#37003c',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#37003c',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PlayerRegistrationScreen;