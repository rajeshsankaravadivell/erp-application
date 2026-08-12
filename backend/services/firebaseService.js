const admin = require('firebase-admin');

class FirebaseService {
  constructor() {
    try {
      this.db = admin.firestore();
    } catch (error) {
      console.error('Error initializing Firestore:', error);
      this.db = null;
    }
  }

  // Collection references
  getCollection(collectionName) {
    if (!this.db) {
      throw new Error('Firebase not initialized');
    }
    return this.db.collection(collectionName);
  }

  // User operations
  async createUser(userData) {
    try {
      const usersRef = this.getCollection('users');
      const docRef = await usersRef.add({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...userData };
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const usersRef = this.getCollection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const usersRef = this.getCollection('users');
      const doc = await usersRef.doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const usersRef = this.getCollection('users');
      await usersRef.doc(userId).update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const doc = await usersRef.doc(userId).get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  // Generic CRUD operations
  async createDocument(collectionName, data) {
    try {
      const collectionRef = this.getCollection(collectionName);
      const docRef = await collectionRef.add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      throw error;
    }
  }

  async getDocuments(collectionName, filters = []) {
    try {
      let query = this.getCollection(collectionName);
      
      // Apply filters
      filters.forEach(filter => {
        if (filter.operator === '==') {
          query = query.where(filter.field, '==', filter.value);
        } else if (filter.operator === '>') {
          query = query.where(filter.field, '>', filter.value);
        } else if (filter.operator === '<') {
          query = query.where(filter.field, '<', filter.value);
        } else if (filter.operator === '>=') {
          query = query.where(filter.field, '>=', filter.value);
        } else if (filter.operator === '<=') {
          query = query.where(filter.field, '<=', filter.value);
        } else if (filter.operator === '!=') {
          query = query.where(filter.field, '!=', filter.value);
        }
      });
      
      const snapshot = await query.get();
      const documents = [];
      
      snapshot.forEach(doc => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return documents;
    } catch (error) {
      throw error;
    }
  }

  async getDocumentById(collectionName, docId) {
    try {
      const docRef = this.getCollection(collectionName).doc(docId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  async updateDocument(collectionName, docId, updateData) {
    try {
      const docRef = this.getCollection(collectionName).doc(docId);
      await docRef.update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  async deleteDocument(collectionName, docId) {
    try {
      const docRef = this.getCollection(collectionName).doc(docId);
      await docRef.delete();
      return { id: docId };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FirebaseService();