import os

def create_file_structure():
   # Root directory structure
   directories = [
       'src/components/MatchScheduler',
       'src/components/ScoreTracking',
       'src/components/Layout',
       'src/context',
       'src/utils',
       'src/services'
   ]
   
   # Files to create
   files = [
       'src/components/MatchScheduler/MatchScheduler.jsx',
       'src/components/MatchScheduler/PlayerSelection.jsx',
       'src/components/MatchScheduler/CurrentMatch.jsx',
       'src/components/MatchScheduler/UpcomingMatches.jsx',
       'src/components/ScoreTracking/ScoreBoard.jsx',
       'src/components/ScoreTracking/MatchHistory.jsx',
       'src/components/ScoreTracking/PlayerStats.jsx',
       'src/components/ScoreTracking/Leaderboard.jsx',
       'src/components/Layout/Header.jsx',
       'src/components/Layout/AppContainer.jsx',
       'src/context/AppContext.jsx',
       'src/utils/rotationCalculator.js',
       'src/services/supabaseClient.js',
       'src/App.jsx',
       'src/index.jsx',
       'src/index.css',
       'src/App.css'
   ]
   
   # Create directories
   for directory in directories:
       os.makedirs(directory, exist_ok=True)
       print(f"Created directory: {directory}")
   
   # Create files
   for file in files:
       with open(file, 'w') as f:
           # You could add template content here if needed
           pass
       print(f"Created file: {file}")
   
   print("File structure created successfully!")

if __name__ == "__main__":
   create_file_structure()