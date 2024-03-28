env_variables = """
AUTH_GITHUB_ID="96c90cb569b5c8ac46c4"
AUTH_GITHUB_SECRET="bcb8c811b4604647a1f0ede6bb6f905140546b5f"
AUTH_REDIRECT_PROXY_URL="http://localhost:5000/api/auth"
NEXTAUTH_URL="http://localhost:5000/"
"""

# Parse the provided environment variables into a dictionary
new_env_vars = dict(line.split('=', 1) for line in env_variables.strip().split('\n'))

env_file_path = '.env.local'

try:
    # Read the current content of the .env.local file
    with open(env_file_path, 'r+') as file:
        lines = file.readlines()
        
        # Keep track of existing keys to identify which new keys need to be added
        existing_keys = set()

        # Update existing variables
        for i, line in enumerate(lines):
            if '=' in line and not line.startswith('#'):
                key, _ = line.split('=', 1)
                if key in new_env_vars:
                    # Update the line with the new value
                    lines[i] = f'{key}={new_env_vars[key]}\n'
                    existing_keys.add(key)

        # Identify which variables are new and need to be added
        new_keys = set(new_env_vars.keys()) - existing_keys
        
        # Add new variables at the end of the file
        if new_keys:
            # Ensure there's a newline at the end of the file
            if lines and not lines[-1].endswith('\n'):
                lines.append('\n')
            for key in new_keys:
                lines.append(f'{key}={new_env_vars[key]}\n')
        
        # Go back to the start of the file to overwrite it
        file.seek(0)
        file.writelines(lines)
        file.truncate()  # Truncate file size in case new content is shorter

    print("The .env.local file has been successfully updated.")

except FileNotFoundError:
    print(f"The file {env_file_path} was not found.")
except Exception as e:
    print(f"An error occurred: {e}")
