import { Response, Request, NextFunction, query } from "express";

import { responseUtils } from "../../utils/response.utils.js";
import { errorWrapper } from "../../middleware/errorWrapper.js";
import { userService } from "./user.service.js";
import { UserRole, UserStatus } from "./user.enum.js";
import { RequestWithUser } from "../../interface/app.interface.js";
import { getPaginationOptions } from "../../utils/pagination.utils.js";
import { ObjectId } from "../../constants/type.js";
import { FilterQuery } from "mongoose";
import User from "./user.model.js";

const userSignUp = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.userSignUp({
      ...req.body,
      role: UserRole.USER,
    });

    return responseUtils.success(res, {
      data,
      status: 201,
    });
  },
);

const userSignIn = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.userSignIn({
      ...req.body,
      role: UserRole.USER,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);

const authorSignUp = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.userSignUp({
      ...req.body,
      role: UserRole.AUTHOR,
    });

    return responseUtils.success(res, {
      data,
      status: 201,
    });
  },
);

const authorSignIn = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.userSignIn({
      ...req.body,
      role: UserRole.AUTHOR,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);
const adminSignIn = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.userSignIn({
      ...req.body,
      role: UserRole.ADMIN,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);

const updateUser = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data = await userService.updateUser(req?.user?._id as string, {
      ...req.body,
      role: UserRole.USER,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);

const followUnfollowUser = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data = await userService.updateUser(req?.user?._id as string, {
      ...req.body,
      role: req?.user?.role,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);
const updateAuthor = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data = await userService.updateUser(req?.user?._id as string, {
      ...req.body,
      role: UserRole.AUTHOR,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);
const updateUserByAdmin = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data = await userService.updateUserByAdmin(req?.params?.id);

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);

const forgotPassword = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.forgotPassword(req?.body);

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);

const updatePassword = errorWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.updatePassword(req.body);

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);

const findUserById = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data = await userService.findUserById({
      userId: req.user?._id as string,
      isFollowing: true,
      isFollowers: true,
      isProfile: true,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);
const findUserByParamId = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data = await userService.findUserById({
      userId: req.params?.id,
      isFollowing: true,
      isFollowers: true,
      isProfile: false,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);
const getAllUsers = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const paginationOptions = getPaginationOptions({
      limit: req.query?.limit,
      page: req.query?.page,
    });

    const data = await userService.getAllUsers({
      query: {
        isDeleted: false,
        role: { $ne: UserRole.ADMIN },
        status: UserStatus.ACTIVE,
        _id: { $ne: new ObjectId(req?.user?._id) },
      },
      options: {
        sort: { createdBy: -1 },
        ...paginationOptions,
      },
      userId: req?.user?._id,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);
const findAvailableUsersForChat = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    let filterQuery: FilterQuery<typeof User> = {
      isDeleted: false,
      status: UserStatus.ACTIVE,
    };
    const searchTerm = req.query?.searchTerm;
    if (searchTerm) {
      filterQuery = {
        ...filterQuery,
        $or: [
          {
            firstName: {
              $regex: new RegExp(String(searchTerm)),
              $options: "i",
            },
          },
          {
            lastName: { $regex: new RegExp(String(searchTerm)), $options: "i" },
          },
        ],
      };
    }

    const data = await userService.findAvailableUsersForChat({
      query: {
        isDeleted: false,
        status: UserStatus.ACTIVE,
        _id: new ObjectId(req?.user?._id),
      },
      filterQuery,
    });

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);

const findFollowersFollowings = errorWrapper(
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const data = await userService.findFollowersFollowings({
      query: {
        _id: new ObjectId(req?.user?._id),
        isDeleted: false,
      },
      filterQuery:
        req?.query?.isFollowers === "true" ? "$followers" : "$followings",
      userId: req?.user?._id,
    });
    console.log(req?.query?.isFollowers);

    return responseUtils.success(res, {
      data,
      status: 200,
    });
  },
);
export {
  userSignUp,
  userSignIn,
  adminSignIn,
  authorSignUp,
  authorSignIn,
  updateUser,
  forgotPassword,
  updatePassword,
  updateUserByAdmin,
  findUserById,
  updateAuthor,
  followUnfollowUser,
  getAllUsers,
  findAvailableUsersForChat,
  findUserByParamId,
  findFollowersFollowings,
};
