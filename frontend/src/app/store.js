import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import interviewSlice from '../features/interview/interviewSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['interview'] // only interview will be persisted
};

const rootReducer = combineReducers({
  interview: interviewSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);