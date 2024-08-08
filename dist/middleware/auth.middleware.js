import jwt from "jsonwebtoken";
import { appConfig } from "../config/appConfig.js";
import User from "../modules/user/user.model.js";
import { UserStatus } from "../modules/user/user.enum.js";
import { errorMessages } from "../constants/messages.js";
import { ObjectId } from "../constants/type.js";
export const protect = (allowedRoles) => {
  return async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith("Bearer") === true) {
      try {
        token = req.headers.authorization.split(" ")[1];
        let decoded = {};
        decoded = jwt.verify(token, appConfig.jwtSecret);
        if (decoded) {
          const user = await User.findOne({
            _id: new ObjectId(decoded?.id),
            isDeleted: false,
          }).select("-password");
          if (user?.status?.status === UserStatus.INACTIVE) {
            res.status(401).send({ message: errorMessages.userAccountBlocked });
          }
          // eslint-disable-next-line security/detect-possible-timing-attacks
          if (allowedRoles == null) {
            req.user = user;
            next();
          } else if (user && allowedRoles.includes(user.role)) {
            req.user = user;
            next();
          } else {
            res.status(403).send({ message: "Forbidden" });
          }
        } else {
          res.status(401).send({ message: "Unauthorized" });
        }
      } catch (error) {
        console.error(error);
        res.status(401).send({ message: "Unauthorized" });
      }
    }
    if (!token) {
      res.status(401).send({ message: "Unauthorized, No token" });
    }
  };
};
export const optionalProtect = (allowedRoles) => {
  return async (req, res, next) => {
    let token;
    if (
      req?.headers?.authorization?.startsWith("Bearer") === true &&
      req.headers.authorization.split(" ")[1]
    ) {
      console.log(req.headers.authorization.split(" ")[1], "calling.....");
      try {
        token = req.headers.authorization.split(" ")[1];
        let decoded = {};
        decoded = jwt.verify(token, appConfig.jwtSecret);
        if (decoded) {
          const user = await User.findOne({
            _id: new ObjectId(decoded?.id),
            isDeleted: false,
          }).select("-password");
          if (allowedRoles == null) {
            req.user = user;
            next();
          } else if (user && allowedRoles.includes(user.role)) {
            req.user = user;
            next();
          } else {
            res.status(403).send({ message: "Forbidden" });
          }
        } else {
          res.status(401).send({ message: "Unauthorized" });
        }
      } catch (error) {
        console.error(error);
        res.status(401).send({ message: "Unauthorized" });
      }
    } else {
      next();
    }
    // if (!token) {
    //   res.status(401).send({ message: "Unauthorized, No token" });
    // }
  };
};
export const authMiddleware = { protect, optionalProtect };
