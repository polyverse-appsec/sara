import { Pencil2Icon } from "@radix-ui/react-icons"
import * as Label from '@radix-ui/react-label'
import { Button, Dialog, Flex, TextArea, TextField, Tooltip } from "@radix-ui/themes"
import GuidelineInputs from "app/(navigatable)/(projects)/projects/create/guideline-inputs"
import { updateResource } from "app/saraClient"
import { GitHubRepo } from "lib/data-model-types"
import { useState } from "react"
import toast from "react-hot-toast"

interface EditProjectPopoutProps {
    projectId: string;
    existingProjectName: string;
    existingProjectDescription: string;
    existingProjectGuidelines: string[];
    onSubmitChange: (refreshPage: boolean) => void;
}

const EditProjectPopout = ({
     projectId, 
     existingProjectName, 
     existingProjectDescription, 
     existingProjectGuidelines,
     onSubmitChange }: EditProjectPopoutProps) => {

  const [open, setOpen] = useState<boolean>(false)
  const [projectName, setProjectName] = useState<string>(existingProjectName)
  const [projectDescription, setProjectDescription] = useState<string>(existingProjectDescription)
  const [projectDataSources, setProjectDataSources] =
    useState<GitHubRepo[]>([])
  const [publicDataSourceUrl, setPublicDataSourceUrl] =
    useState<string | null>(null)
  const [controlledProjectGuidelines, setControlledProjectGuidelines] =
    useState<string[]>(existingProjectGuidelines)
  const [disableInputs, setDisableInputs] = useState<boolean>(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>
            <Tooltip content="Edit Project">
                <Pencil2Icon />
            </Tooltip>
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <form
          onSubmit={(e) => {
            setDisableInputs(true)
            const reqBody = {
              projectName,
              projectDescription,
              controlledProjectGuidelines,
            }

            updateResource(`/projects/${projectId}/config`, reqBody)
              .then(() => {
                setOpen(false)
                onSubmitChange(true)
                setDisableInputs(false)
                toast.success('Project details updated successfully')
              })
              .catch(() => {
                setOpen(false)
                setDisableInputs(false)
              })
            e.preventDefault()
          }}
        >
          <Dialog.Title>
            Edit Project Details
          </Dialog.Title>
          <Flex direction="column" gap="3">
            <>
              <Label.Root>Name</Label.Root>
              <TextField.Root
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={disableInputs}
              />
            </>
            <>
              <Label.Root>Description</Label.Root>
              <TextArea
                value={projectDescription}
                style={{ height: '200px' }}
                onChange={(e) => setProjectDescription(e.target.value)}
                disabled={disableInputs}
              />
            </>
            <>
              <Label.Root>Guidelines</Label.Root>
              <GuidelineInputs
                  disableInput={disableInputs}
                  existingProjectGuidelines={existingProjectGuidelines}
                  setProjectGuidelines={(guidelines: string[]) =>
                    setControlledProjectGuidelines(guidelines)
                  }
                />
            </>
            <Flex justify="end" gap="3">
              <Dialog.Close>
                <Button color="gray" disabled={disableInputs}>Cancel</Button>
              </Dialog.Close>
              <Button type="submit" disabled={disableInputs}>Submit</Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
    )
  }
  
  export default EditProjectPopout