'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

import { useAppContext } from './../lib/hooks/app-context';
import SaraPortrait from './../public/Sara_Cartoon_Portrait.png';
import NavResourceLoader from './nav-resource-tree/nav-resource-loader';
import { ProjectHealth, ProjectHealthStatusValue, ProjectPartDeux, UserOrgStatus } from 'lib/data-model-types';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { useSession } from 'next-auth/react';
import { SaraSession } from 'auth';
import { UserMenu } from 'components/user-menu'; // Update this import based on your project structure

const renderHealthIcon = (readableHealthValue: ProjectHealthStatusValue) => {
  if (readableHealthValue === 'UNHEALTHY') {
    return <p>🛑</p>;
  }

  if (readableHealthValue === 'PARTIALLY_HEALTHY') {
    return <p>⚠️</p>;
  }

  if (readableHealthValue === 'HEALTHY') {
    return <p>✅</p>;
  }

  return <p>🔎</p>;
};

const getOrgUserStatus = async (
  orgId: string,
  userId: string,
): Promise<UserOrgStatus> => {
  const res = await fetch(`/api/orgs/${orgId}/users/${userId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.debug(`Failed to get User Status because: ${errText}`);
    throw new Error(`Failed to get user status`);
  }

  const userStatus = (await res.json()) as UserOrgStatus;
  return userStatus;
};

const SidebarNav = () => {
  const router = useRouter();
  const { user, activeBillingOrg, setActiveBillingOrg, projectIdForConfiguration } = useAppContext();
  const session = useSession();
  const saraSession = session.data ? (session.data as SaraSession) : null;

  const [selectedProject, setSelectedProject] = useState<ProjectPartDeux | null>(null);
  const [selectedProjectHealth, setSelectedProjectHealth] = useState<ProjectHealth | null>(null);
  const [orgIsPremium, setOrgIsPremium] = useState(false);

  useEffect(() => {
    const fetchAndSetActiveBillingOrg = async () => {
      if (!activeBillingOrg) {
        const res = await fetch('/api/orgs/active'); // Adjust this endpoint as needed
        if (res.ok) {
          const org = await res.json();
          setActiveBillingOrg(org);
        } else {
          toast.error('Failed to load billing organization. Please set an active organization.');
          router.push('/settings/organizations'); // Adjust this redirect as needed
          return;
        }
      }
    };

    fetchAndSetActiveBillingOrg();

    const fetchPremiumStatus = async () => {
      try {
        if (!activeBillingOrg || !saraSession) {
          return;
        }

        const orgUserStatus = await getOrgUserStatus(activeBillingOrg.id, saraSession.id);

        setOrgIsPremium(orgUserStatus.isPremium === 'PREMIUM');
      } catch (err) {
        console.debug(`Failed to fetch premium status because: ${err}`);
      }
    };

    if (projectIdForConfiguration) {
      const fetchProjectDetails = async () => {
        try {
          const projectRes = await fetch(`/api/projects/${projectIdForConfiguration}`);

          if (!projectRes.ok) {
            const errText = await projectRes.text();
            throw new Error(`Failed to get a success response when fetching project '${projectIdForConfiguration}' because: ${errText}`);
          }

          const fetchedProject = (await projectRes.json()) as ProjectPartDeux;
          setSelectedProject(fetchedProject);

          const healthRes = await fetch(`/api/projects/${projectIdForConfiguration}/health`);

          if (healthRes.ok) {
            const fetchedHealth = (await healthRes.json()) as ProjectHealth;
            setSelectedProjectHealth(fetchedHealth);
          } else {
            console.debug(`Failed to get project health`);
          }
        } catch (err) {
          console.debug(`Failed to fetch project details because: ${err}`);
        }
      };

      fetchProjectDetails();
    }

    fetchPremiumStatus();
  }, [activeBillingOrg, setActiveBillingOrg, projectIdForConfiguration, saraSession, router]);

  return (
    <motion.aside
      className="absolute inset-y-0 left-0 -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out"
      initial={{ width: 0 }}
      animate={{ width: 250 }}
      exit={{ width: 0 }}
      transition={{ type: 'spring', bounce: 0 }}
      style={{
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        paddingTop: '1.75rem', // py-7
        paddingLeft: '0.5rem', // px-2
        paddingRight: '0.5rem', // px-2
        width: '16rem', // w-64
      }}
    >
      {/* Logo section */}
      <div className="flex flex-col items-center p-4 ">
        <Image
          src={SaraPortrait} // Adjust the path to your image
          alt="Sara's Portrait"
          width={100} // Adjust the width as needed
          height={100} // Adjust the height as needed
        />
        <UserMenu user={user} />
      </div>
      <div className="flex justify-center px-2 py-1 text-base font-medium rounded-lg">
        <p>{activeBillingOrg ? activeBillingOrg.name : 'No org selected'}</p>
        { orgIsPremium ? 
          <div title="Premium Plan" className="ml-1">
            <div className="p-1 border border-yellow-500 rounded-full">
              <StarFilledIcon className="w-3 h-3 text-yellow-500" /> 
            </div>
          </div> : null }
      </div>
      {/* Buttons section */}
      <nav className="flex flex-col space-y-1">
        {/* Projects Button */}
        <button
          className="flex items-center px-2 py-1 text-base font-medium rounded-lg hover:bg-secondary"
          style={{
            color: 'var(--secondary-foreground)',
            backgroundColor: 'var(--secondary)',
            borderWidth: '1px',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius)',
          }}
          onClick={(event) => {
            event.preventDefault()

            if (!activeBillingOrg) {
              toast.error(`Please select billing organization`)
              return
            }

            router.push('/projects')
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
          <span className="ml-3">Projects</span>
        </button>
      </nav>
      { projectIdForConfiguration ? (
        <div className="flex justify-center items-center px-2 py-1 text-base font-medium rounded-lg">
          <div className="">
            <p>{ selectedProject ? selectedProject.name : null}</p>
          </div>
          { selectedProjectHealth ? renderHealthIcon(selectedProjectHealth.readableValue) : null}
        </div>
      ) : <p className="flex justify-center px-2 py-1 text-base font-medium rounded-lg">No project selected</p>}
      {projectIdForConfiguration ? (
        <NavResourceLoader projectId={projectIdForConfiguration} />
      ) : null}
    </motion.aside>
  )
}

export default SidebarNav
