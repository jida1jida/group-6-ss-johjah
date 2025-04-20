require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static('public'));

//////////////////////////////////////
//ROUTES TO SERVE HTML FILES
//////////////////////////////////////
// Default route to serve logon.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/logon.html');
});

app.get('/logon', (req, res) => {
    res.sendFile(__dirname + '/public/logon.html');
});

// Route to serve dashboard.html
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// Route to serve mainmenu.html
app.get('/mainmenu', (req, res) => {
    res.sendFile(__dirname + '/public/mainmenu.html');
});

// Route to serve meditation.html
app.get('/meditation', (req, res) => {
    res.sendFile(__dirname + '/public/meditation.html');
});

// Route to serve account.html
app.get('/account', (req, res) => {
    res.sendFile(__dirname + '/public/account.html');
})

// Route to serve customize.html
app.get('/customize', (req, res) => {
    res.sendFile(__dirname + '/public/customize.html');
})

// Route to serve resources.html
app.get('/resources', (req, res) => {
    res.sendFile(__dirname + '/public/resources.html');
})

//////////////////////////////////////
//END ROUTES TO SERVE HTML FILES
//////////////////////////////////////


/////////////////////////////////////////////////
//HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////
// Helper function to create a MySQL connection
async function createConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}

// **Authorization Middleware: Verify JWT Token and Check User in Database**
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }

        try {
            const connection = await createConnection();

            // Query the database to verify that the email is associated with an active account
            const [rows] = await connection.execute(
                'SELECT email FROM user WHERE email = ?',
                [decoded.email]
            );

            await connection.end();  // Close connection

            if (rows.length === 0) {
                return res.status(403).json({ message: 'Account not found or deactivated.' });
            }

            req.user = decoded;  // Save the decoded email for use in the route
            next();  // Proceed to the next middleware or route handler
        } catch (dbError) {
            console.error(dbError);
            res.status(500).json({ message: 'Database error during authentication.' });
        }
    });
}
/////////////////////////////////////////////////
//END HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////


//////////////////////////////////////
//ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////
// Route: Create Account
app.post('/api/create-account', async (req, res) => {
    const { email, password, name, type } = req.body;

    if (!email || !password  || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required.' });
    }

    try {
        const connection = await createConnection();
        const hashedPassword = await bcrypt.hash(password, 10);  // Hash password

        const [result] = await connection.execute(
            'INSERT INTO user (email, password, prefname, type) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, name, type]
        );

        await connection.end();  // Close connection

        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'An account with this email already exists.' });
        } else {
            console.error(error);
            res.status(500).json({ message: 'Error creating account.' });
        }
    }
});

// Route: Logon
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const connection = await createConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        await connection.end();  // Close connection

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in.' });
    }
});

// Route: Get All Email Addresses and Prefnames
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        // Fetch both email and prefname from the database
        const [rows] = await connection.execute('SELECT email, prefname, type FROM user');

        await connection.end();  // Close connection

        // Map the result to include both email and prefname
        const usersList = rows.map((row) => ({
            email: row.email,
            prefname: row.prefname,
            type: row.type,
        }));

        res.status(200).json({ users: usersList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving user data.' });
    }
});

// Route: log a meditation session (duration, type, mood)
app.post('/api/med-session', authenticateToken, async (req, res) => {
    const { duration, type, mood } = req.body;
    const userEmail = req.user.email;

    // get session info
    try {
        const connection = await createConnection();
        
        // streak
        const [rows] = await connection.execute(
            'SELECT * FROM user WHERE email = ?',
            [userEmail]
        );

        let new_streak = 1;

        const now = new Date();
        const local_date = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toLocaleDateString('en-CA');
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const local_yesterday_date = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000);
        const local_yesterday = local_yesterday_date.toLocaleDateString('en-CA');

        if (rows.length > 0 && rows[0].last_session_date) {
            const last_session_date = new Date(rows[0].last_session_date);

            if (last_session_date.toLocaleDateString('en-CA') === local_date) { // if last session date is today...
                new_streak = rows[0].streak_count; // streak is unchanged
            } else if (last_session_date.toLocaleDateString('en-CA') === local_yesterday) { // if last session date is yesterday...
                new_streak = rows[0].streak_count + 1; // increment streak by 1
            }
        }
        
        // update streak
        await connection.execute(
            'update user set streak_count = ?, last_session_date = ? where email = ?',
            [new_streak, local_date, userEmail]
        );
        
        // log session
        await connection.execute(
            'insert into session_log (email, session_duration_seconds, session_type, mood) values (?, ?, ?)',
            [userEmail, duration, type, mood || null]
        );
        await connection.end();

        res.status(201).json({
            message: 'Meditation session logged successfully!'});
    } catch (error) {
        console.error('Error logging meditation session: ', error);
        res.status(500).json({message: 'Error logging session!'});
    }

});

// Route: get streak information
app.get('/api/streak', authenticateToken, async (req, res) => {
    const userEmail = req.user.email;

    try {
        const connection = await createConnection();
        const [rows] = await connection.execute(
            'select streak_count, last_session_date from user where email = ?',
            [userEmail]
        );
        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({message: 'User not found!'});
        }

        res.status(200).json({
            streak: rows[0].streak_count, 
            lastSessionDate: rows[0].last_session_date 
        });
        console.log(rows[0])
    } catch (error) {
        console.error('Error fetching streak info: ', error);
        res.status(500).json({ message: 'Error fetching streak info!'});
    }
})

// Route: reset user's streak to 0 if needed.
app.post('/api/reset-streak-if-needed', authenticateToken, async (req, res) => {
    const userEmail = req.user.email;
    
    try {
        const connection = await createConnection();
        const [rows] = await connection.execute(
            'select streak_count, last_session_date from user where email = ?',
            [userEmail]
        );

        if (rows.length === 0) {  // user not found, throw error
            await connection.end();
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = rows[0];
        const now = new Date();
        const lastSessionDate = new Date(user.last_session_date);
        const local_date = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const local_yesterday_date = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000);

        const lastSessionWasYesterday = lastSessionDate.toDateString() === yesterday.toDateString();
        const lastSessionWasToday = lastSessionDate.toDateString() === local_date.toDateString();

        // If last session is neither yesterday nor today, reset streak to 0
        if (!lastSessionWasYesterday && !lastSessionWasToday && user.streak_count > 0) {
            await connection.execute(
                'update user set streak_count = 0 where email = ?',
                [userEmail]
            );
            await connection.end();
            return res.status(200).json({ message: 'Streak reset to 0 for user ', userEmail});
        }

        await connection.end();
        res.status(200).json({ message: `No changes to streak for ${userEmail}`});
    } catch (error) {
        console.error('Error checking/resetting streak:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Route: get user's weekly meditation statistics to display on homepage
app.get('/api/weekly-med-stats', authenticateToken, async (req, res) => {
    const userEmail = req.user.email;
    
    try {
        const connection = await createConnection();

        // Find the most recent Sunday
        const today = new Date();
        const daysSinceSunday = today.getDay(); // set day number (Sunday = 0 ... Saturday = 6)
        const lastSunday = new Date(today);
        lastSunday.setDate(today.getDate() - daysSinceSunday);
        lastSunday.setHours(0, 0, 0, 0); // set time to midnight
        const formattedLastSunday = lastSunday.toISOString().split('T')[0];

        // Get total meditation minutes since last Sunday
        const [rows] = await connection.execute(
            `select sum(session_duration_seconds) AS totalSeconds
             FROM session_log
             WHERE email = ? AND session_date >= ?`,
            [userEmail, formattedLastSunday]
        );

        await connection.end();

        totalMinutes = rows[0].totalSeconds / 60;

        res.status(200).json({ totalMinutes: totalMinutes || 0 });
        console.log(`Med mins for week starting ${formattedLastSunday}: ${totalMinutes}`);
    } catch (error) {
        console.error('Error fetching weekly meditation data:', error);
        res.status(500).json({ message: 'Server error.' });
    }

});

// Route: get a json list of the days the user meditated for the calendar
app.get('/api/med-days', authenticateToken, async(req, res) => {
    const userEmail = req.user.email;

    try{
        const connection = await createConnection();
        const [rows] = await connection.execute(
            'select distinct date(session_date) as med_session_date from session_log where email = ?',
            [userEmail]
        );
        await connection.end();

        const dates = rows.map(row => row.med_session_date.toISOString().split('T')[0]);
        res.json({ dates });
    } catch (error) {
        console.error('Error fetching meditation days! ', error);
        res.status(500).json({ message: 'Server error!' });
    }
});

// Route: verify user's password to allow account changes
app.post('/api/verify-password', authenticateToken, async(req, res) => {
    const userEmail = req.user.email;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password is required.' });
    }

    try {
        const connection = await createConnection();

        const [rows] = await connection.execute(
            'SELECT password FROM user WHERE email = ?',
            [userEmail]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
            console.log('User not found');
        }

        const storedHashedPassword = rows[0].password;
        const isValid = await bcrypt.compare(password, storedHashedPassword);

        if (isValid) {
            res.status(200).json({ message: 'Password verified.' });
        } else {
            res.status(401).json({ message: 'Incorrect password.' });
        }

    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ message: 'Server error!' });
    }
});

app.post('/api/update-user', authenticateToken, async (req, res) => {
    const oldEmail = req.user.email;
    const { newEmail, newName, newPassword, newType } = req.body;

    try {
        const connection = await createConnection();

        // Check if the new email is different
        if (newEmail && newEmail !== oldEmail) {
            const [existingEmailRows] = await connection.execute(
                'SELECT email FROM user WHERE email = ?',
                [newEmail]
            );

            if (existingEmailRows.length > 0) {
                await connection.end();
                return res.status(409).json({ message: 'An account with this email already exists. Please try again!' });
            }
        }

        // Update user info
        if (newName) {
            await connection.execute(
                'UPDATE user SET prefname = ? WHERE email = ?',
                [newName, newEmail || oldEmail]
            );
        }

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await connection.execute(
                'UPDATE user SET password = ? WHERE email = ?',
                [hashedPassword, newEmail || oldEmail]
            );
        }

        if (newType) {
            await connection.execute(
                'UPDATE user SET type = ? WHERE email = ?',
                [newType, newEmail || oldEmail]
            );
        }

        if (newEmail && newEmail !== oldEmail) {
            await connection.execute(
                'UPDATE user SET email = ? WHERE email = ?',
                [newEmail, oldEmail]
            );

            // update session_log if email is changing
            await connection.execute(
                'UPDATE session_log SET email = ? WHERE email = ?',
                [newEmail, oldEmail]
            );
        }

        await connection.end();
        res.status(200).json({ message: 'Account updated successfully.' });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: 'Server error while updating account.' });
    }
});

// Route: update user's password
app.put('/api/update-password', authenticateToken, async (req, res) => {
    const userEmail = req.user.email;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: 'New password required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const connection = await createConnection();

        await connection.execute(
            'UPDATE user SET password = ? WHERE email = ?',
            [hashedPassword, userEmail]
        );

        await connection.end();
        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: 'Failed to update password.' });
    }
});

//////////////////////////////////////
//END ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});