# Online Voting System

A secure and modern online voting application built with React, TypeScript, and Supabase. This application allows users to register, manage their voter profiles, view active elections, and cast their votes securely.

## Features

### User Authentication
- **Email/Password Registration & Login:** Users can create accounts and sign in using their email and a secure password.
- **Email Verification:** New registrations require email verification, enhancing security and ensuring valid user accounts. (Powered by Supabase Auth)

### Voter Profile Management
- **Create/View Profile:** Users can create and view their detailed voter profiles, including full name, date of birth, address, and a unique voter ID.
- **Edit Profile:** A dedicated interface allows users to update their profile information.
- **Instant Verification:** Upon saving, profiles are automatically marked as 'verified' (as per current implementation), bypassing a manual verification step.

### Election Management
- **Election Listing:** Users can browse a list of active, upcoming, and completed elections.
- **Election Details:** Each election displays its title, description, start/end dates, and a list of participating candidates.
- **Vote Count:** Displays the total number of votes cast for each election.

### Secure Voting Interface
- **Candidate Selection:** Users can select their preferred candidate for each active election.
- **Vote Confirmation Dialog:** Before casting a vote, a modern UI alert dialog (powered by Shadcn UI) prompts the user for confirmation, preventing accidental submissions.
- **Vote Confirmation Notification:** After a successful vote, a visually appealing toast notification (powered by Shadcn UI) confirms that the vote has been recorded.
- **Duplicate Vote Prevention:** Users can only cast one vote per election.
- **Profile Verification Requirement:** Only users with a 'verified' profile can cast votes.

## Technologies Used

### Frontend
- **React:** A JavaScript library for building user interfaces.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **Vite:** A fast build tool that provides an instant development server.
- **Tailwind CSS:** A utility-first CSS framework for rapidly building custom designs.
- **Shadcn UI:** A collection of re-usable components built using Radix UI and Tailwind CSS, providing modern and accessible UI elements.
- **Lucide React:** A collection of beautiful and customizable open-source icons.

### Backend
- **Supabase:** An open-source Firebase alternative providing:
    - **PostgreSQL Database:** A powerful relational database for storing application data.
    - **Supabase Auth:** Handles user authentication, including email/password sign-up, sign-in, and email verification.
    - **Row Level Security (RLS):** Ensures data security by restricting data access based on user roles and policies.
    - **Realtime:** (Potentially used for real-time updates, though not explicitly implemented for all features in the provided code snippets).

## Database Schema

The application uses the following tables in Supabase:

### `voter_profiles`
Stores detailed information about each registered voter.
- `id` (UUID, Primary Key, references `auth.users.id`)
- `full_name` (TEXT, NOT NULL)
- `date_of_birth` (DATE, NOT NULL)
- `address` (TEXT, NOT NULL)
- `voter_id` (TEXT, UNIQUE, NOT NULL)
- `id_document_url` (TEXT, NULLABLE)
- `verification_status` (ENUM: 'pending', 'verified', 'rejected', DEFAULT 'verified')
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### `elections`
Stores information about each election.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `start_date` (TIMESTAMPTZ, NOT NULL)
- `end_date` (TIMESTAMPTZ, NOT NULL)
- `status` (ENUM: 'upcoming', 'active', 'completed', DEFAULT 'upcoming')
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### `candidates`
Stores information about candidates participating in elections.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `election_id` (UUID, Foreign Key to `elections.id`, NOT NULL)
- `name` (TEXT, NOT NULL)
- `party` (TEXT, NOT NULL)
- `bio` (TEXT, DEFAULT '')
- `photo_url` (TEXT, DEFAULT '')
- `position` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

### `votes`
Records each vote cast by a user.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `election_id` (UUID, Foreign Key to `elections.id`, NOT NULL)
- `voter_id` (UUID, Foreign Key to `auth.users.id`, NOT NULL)
- `candidate_id` (UUID, Foreign Key to `candidates.id`, NOT NULL)
- `cast_at` (TIMESTAMPTZ, DEFAULT NOW())
- `ip_address` (TEXT, NULLABLE)
- `UNIQUE(election_id, voter_id)`: Ensures a user can only vote once per election.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or Yarn
- A Supabase project (with database and authentication enabled)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Aqibsheik/online-voting-app.git
    cd online-voting-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Supabase:**
    - Create a new project on [Supabase](https://supabase.com/).
    - Go to `Project Settings` -> `API` and copy your `Project URL` and `Anon Key`.

4.  **Configure environment variables:**
    - Create a `.env` file in the root of your project.
    - Add your Supabase credentials:
      ```
      VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
      VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
      ```

5.  **Apply Database Migrations:**
    - Ensure you have the Supabase CLI installed globally (`npm install -g supabase`).
    - Log in to Supabase CLI:
      ```bash
      supabase login
      ```
    - Link your local project to your Supabase project (use your project's reference ID, found in your Supabase project URL):
      ```bash
      supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
      ```
    - Push the database schema and seed data:
      ```bash
      supabase db push --yes
      ```

### Running the Application

```bash
npm run dev
# or
yarn dev
```
The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

This project is licensed under the MIT License.