import { checkRole, getRole } from '@/utils/roles';
import { redirect } from 'next/navigation';
import React from 'react';
import ProfessionalDashboard from './professionaldashboard';

const ProfessionalPage = async() => {
  const isProfessional = await checkRole("Professional");
  const role = await getRole();

  if(!isProfessional) {
    redirect(`/${role}`)
  }
  
  return (<ProfessionalDashboard/>)
}

export default ProfessionalPage