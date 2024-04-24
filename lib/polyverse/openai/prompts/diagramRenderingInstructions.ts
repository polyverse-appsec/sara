export const FlowDiagramRenderingWithMermaid = (): string => {
    return (
  `    If you are asked to generate flow graph or visual algorithm for source code or software - display the results in syntactically correct Mermaid format.
  If you identify a primary path through the code, show it with the primary style below. Alternate non-error paths should use the default non-colored style. Error paths should use the style below.
  The start of the graph should be the function name being analyzed, if available.
  If you identify a call to an external library or non-standard function, make sure it is shown in the diagram as a distinct flow block.
  If there is control flow to the source code, prefix the Mermaid output with markdown code syntax to indicate a Mermaid block. Example syntax should follow the form:
  
  \`\`\`mermaid
  graph TD;
  style Start fill:#228B22, stroke:#000000, strokeWidth:2px;
  style ExampleProcess fill:#228B22, stroke:#000000, strokeWidth:4px;
  style ExampleErrorPath fill:#B22222, stroke:#000000, strokeWidth:2px;
  style ExampleProcess fill:#228B22, stroke:#000000, strokeWidth:4px;
  style ExampleErrorPath fill:#B22222, stroke:#000000, strokeWidth:2px;
  
      Start-->ExampleProcess;
      Start-->ExampleErrorPath;
      ExampleProcess-->End;
      ExamplErrorPath-->End;
  \`\`\`
  `);
  }

export const GeneralDiagramInstructionsWithMermaid = (): string => {
  return (
`    In the Mermaid code syntax, do not use parenthesis, invalid or special characters.
  `)}

export const ClassDiagramRenderingWithMermaid = (): string => {
    return (
  `     If you are asked to generate a class, object or interface diagram - display the results in syntactically correct Mermaid format.
  If you identify any inheritance or implementation relationships, show these with a primary style indicated below. Composition and aggregation relationships should use a default non-colored style. Any error or exceptional relationships should use the style below.
  The start of the diagram should display the main class or interface being analyzed.
  If you identify any external dependencies or non-standard types used in the class, make sure they are shown in the diagram as distinct blocks.
  If there is class diagram data to be shown, prefix the Mermaid output with markdown code syntax to indicate a Mermaid block. Example syntax should follow the form:
  
  \`\`\`mermaid
  classDiagram
      class Start {
          +String exampleVariable
          +void exampleMethod()
      }
      class ExampleDependency {
          +int dependencyVariable
      }
      Start --|> ExampleDependency : inheritance
      Start *-- ExampleComponent : composition
      Start o-- ExampleAssociation : aggregation
      class ExampleError {
          String errorStatus
      }
      Start --x ExampleError : error path
  \`\`\`
  
  `);
  }
  export const ArchitecturalDiagramRenderingWithMermaid = (): string => {
    return (
  `    If you are asked to generate an architectural diagram - displaying the results in syntactically correct Mermaid format.
  Highlight the main components such as databases, servers, clients, and external services with distinct styles. Show interactions between these components using a primary style indicated below. Auxiliary services or secondary interactions should use a default non-colored style. Error or exception handling paths should use the style below.
  The start of the diagram should display the main component or server being analyzed.
  If you identify any external systems or non-standard interfaces used in the architecture, make sure they are shown in the diagram as distinct blocks.
  If there is architectural data to be shown, prefix the Mermaid output with markdown code syntax to indicate a Mermaid block. Example syntax should follow the form:
  
  \`\`\`mermaid
  graph TD;
      style MainComponent fill:#228B22, stroke:#000000, strokeWidth:2px;
      style Database fill:#00008B, stroke:#FFFFFF, strokeWidth:2px;
      style ExternalService fill:#B8860B, stroke:#000000, strokeWidth:2px;
      style ErrorHandler fill:#B22222, stroke:#000000, strokeWidth:2px;
  
      MainComponent-->Database;
      MainComponent-->ExternalService;
      ExternalService-->Database;
      MainComponent-->ErrorHandler;
      ErrorHandler-.->ExternalService;
  \`\`\`
  `);
  }
  
export const DiagramRenderingShortInstructionsForGoalsWithMermaid = (): string => {
  return (
`    If you are asked to generate a diagram of flow control, algorithms, class or object or interface diagrams, or architectural diagrams - generate syntatically correct Mermaid syntax, using the Mermaid diagram instructions previously to you.
  `)}

export const DiagramRenderingShortInstructionsForAssistantWithMermaid = (): string => {
  return (
`    If you are asked to generate a diagram of flow control, algorithms, class or object or interface diagrams, or architectural diagrams - generate syntatically correct Mermaid syntax, using the following Mermaid diagram instructions:
  `)}