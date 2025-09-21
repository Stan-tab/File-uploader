const strategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const passport = require("passport");
const { prisma } = require("../controllers/mainController");

const localStrat = new strategy(async (user, password, done) => {
	try {
		const userData = await prisma.user.findUnique({
			where: {
				username: user,
			},
		});
		if (!userData)
			return done(null, false, { message: "Incorrect name or password" });
		const match = await bcrypt.compare(password, userData.password);
		if (!match)
			return done(null, false, { message: "Incorrect name or password" });
		return done(null, userData);
	} catch (e) {
		return done(e);
	}
});

passport.use(localStrat);
passport.serializeUser((user, done) => {
	done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id },
		});
		done(null, user);
	} catch (e) {
		done(e);
	}
});

module.exports = passport;
