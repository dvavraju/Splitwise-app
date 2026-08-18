import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Setup from './screens/Setup';
import People from './screens/People';
import PersonForm from './screens/PersonForm';
import Home from './screens/Home';
import AddExpenseChoice from './screens/AddExpenseChoice';
import AddExpenseManual from './screens/AddExpenseManual';
import AddExpenseBill from './screens/AddExpenseBill';
import Transactions from './screens/Transactions';
import TransactionDetail from './screens/TransactionDetail';
import SettingsScreen from './screens/Settings';
import { useSelf } from './db/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

export default function App() {
  const self = useSelf();
  const peopleCount = useLiveQuery(() => db.people.count());

  // Wait for the first Dexie read before deciding whether setup is needed.
  if (peopleCount === undefined) return null;

  if (!self) {
    return (
      <Routes>
        <Route path="*" element={<Setup />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/people" element={<People />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
      <Route path="/people/new" element={<PersonForm />} />
      <Route path="/people/:id/edit" element={<PersonForm />} />
      <Route path="/add" element={<AddExpenseChoice />} />
      <Route path="/add/manual" element={<AddExpenseManual />} />
      <Route path="/add/bill" element={<AddExpenseBill />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
