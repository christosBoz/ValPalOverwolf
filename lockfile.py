import os

# Define the path to the lockfile
lockfile_path = os.path.join(
    os.getenv("LOCALAPPDATA"), r"Riot Games\Riot Client\Config\lockfile"
)

def read_lockfile(path):
    try:
        with open(path, 'r') as file:
            lockfile_content = file.read()
        return lockfile_content
    except FileNotFoundError:
        return "Lockfile not found"
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    # Read the lockfile
    lockfile_content = read_lockfile(lockfile_path)
    
    # Print the content of the lockfile
    print("Lockfile Content:")
    print(lockfile_content)