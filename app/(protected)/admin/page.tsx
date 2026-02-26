import { checkRole, getRole } from '@/utils/roles';
import { redirect } from 'next/navigation';
import React from 'react';
import AdminDashboard from './admindashboard';

const AdminPage = async() => {
  const isAdmin = await checkRole("Admin");
  const role = await getRole();

  if(!isAdmin) {
    redirect(`/${role}`)
  }
  
  return (<AdminDashboard />)
}

export default AdminPage