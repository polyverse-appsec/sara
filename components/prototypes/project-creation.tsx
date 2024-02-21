'use client'

import React from 'react'
import * as ScrollArea from '@radix-ui/react-scroll-area'

import { Button } from './../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './../ui/dropdown-menu'
import { Input } from './../ui/input'
import { Label } from './../ui/label'

export const ProjectCreation = () => {
  return null

  // TODO: Start here - Finish this. This was from the dialog of project creation when in the top nav bar.
  // I stopped as it makes sense to do Organization view and selection so that this can be its
  // own navigatable route that queries for repos from the organization when the page is displayed.

  //   return (
  //     <div>
  //       <div className="p-4 space-y-1 text-sm border rounded-md">
  //         <div className="font-medium">
  //           Basic Project Details
  //           <div className="text-muted-foreground">
  //             <Label>
  //               Name
  //               <Input
  //                 value={projectName}
  //                 onChange={(e) => setProjectName(e.target.value)}
  //               />
  //             </Label>
  //           </div>
  //         </div>
  //       </div>
  //       <div className="p-4 space-y-1 text-sm border rounded-md">
  //         <div className="font-medium">Select Primary Data Source</div>
  //         <div className="text-muted-foreground">
  //           <DropdownMenu>
  //             <DropdownMenuTrigger asChild>
  //               <Button variant="ghost" className="pl-0">
  //                 {primaryDataSource ? (
  //                   <span className="pl-1">{primaryDataSource.name}</span>
  //                 ) : (
  //                   <span className="flex pl-1 min-w-64 text-left">
  //                     Data Sources...
  //                   </span>
  //                 )}
  //               </Button>
  //             </DropdownMenuTrigger>
  //             <DropdownMenuContent
  //               sideOffset={8}
  //               align="start"
  //               className="min-w-64"
  //             >
  //               {repos.map((repo) => (
  //                 <DropdownMenuItem
  //                   key={repo.name}
  //                   onSelect={(event) => {
  //                     // Firstly delete from the secondary data sources
  //                     // whatever was selected...
  //                     delete secondaryDataSources[repo.id]

  //                     // Add back the previously selected primary data
  //                     // source...
  //                     if (primaryDataSource) {
  //                       secondaryDataSources[primaryDataSource.id] = {
  //                         checked: false,
  //                         repo,
  //                       }
  //                     }

  //                     // Now update the primary data source...
  //                     setPrimaryDataSource(repo)
  //                   }}
  //                 >
  //                   <span className="ml-2 text-ellipsis whitespace-nowrap overflow-hidden">
  //                     {repo.name}
  //                   </span>
  //                 </DropdownMenuItem>
  //               ))}
  //             </DropdownMenuContent>
  //           </DropdownMenu>
  //         </div>
  //       </div>
  //       <div className="p-4 space-y-1 text-sm border rounded-md">
  //         <div className="font-medium">Select Secondary Data Sources</div>
  //         <div className="text-muted-foreground">
  //           {!primaryDataSource ? (
  //             <span className="flex pl-1 min-w-64 text-left">
  //               Select primary data source...
  //             </span>
  //           ) : (
  //             <ScrollArea.Root>
  //               <ScrollArea.Viewport className="max-h-80">
  //                 <div style={{ padding: '15px 20px' }}>
  //                   {renderSecondaryDataSources(
  //                     secondaryDataSources,
  //                     setSecondaryDataSources,
  //                     primaryDataSource ? [primaryDataSource.id] : null,
  //                   )}
  //                 </div>
  //               </ScrollArea.Viewport>
  //               <ScrollArea.Scrollbar orientation="vertical">
  //                 <ScrollArea.Thumb />
  //               </ScrollArea.Scrollbar>
  //               <ScrollArea.Corner />
  //             </ScrollArea.Root>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   )
}
