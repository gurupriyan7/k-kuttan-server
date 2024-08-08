import bcrypt from "bcryptjs";
import User from "./user.model.js";
import { generateAPIError } from "../../errors/apiError.js";
import { errorMessages, successMessages } from "../../constants/messages.js";
import { hashValue } from "./user.utils.js";
import { UserApprovalStatus, UserRole, UserStatus } from "./user.enum.js";
import { generateToken } from "../../utils/auth.utils.js";
import { ObjectId } from "../../constants/type.js";
import { getUuid, resetLinkEmailTemplate } from "../../utils/app.utils.js";
import { sendEmail } from "../../utils/sendMail.js";
import Post from "../../modules/post/post.model.js";
const userSignUp = async (userData) => {
  const {
    firstName,
    lastName,
    userName,
    password,
    email,
    role,
    // phoneNumber,
    profileImage,
    coverImage,
  } = userData;
  const userExists = await User.findOne({
    email,
    role,
    isDeleted: false,
  });
  console.log(userExists, "user", userData);
  if (userExists != null) {
    return await generateAPIError(errorMessages.userExists, 400);
  }
  const hashedPassword = await hashValue(password, 10);
  const user = await User.create({
    firstName,
    lastName,
    email,
    role,
    userName,
    // phoneNumber,
    profileImage,
    coverImage,
    ...(profileImage != null && {
      profileImage,
    }),
    ...(coverImage != null && {
      coverImage,
    }),
    password: hashedPassword,
  });
  return {
    firstName: user?.firstName,
    lastName: user?.lastName,
    userName: user?.userName,
    email: user?.email,
    role: user?.role,
    // phoneNumber: user?.phoneNumber,
    status: user?.status,
    profileImage: user?.profileImage,
    token: await generateToken({
      id: String(user?._id),
    }),
  };
};
const userSignIn = async (userData) => {
  const { email, password, role } = userData;
  const user = await User.findOne({
    email,
    isDeleted: false,
    role,
  });
  // if(isAuthor&& user?.approvalStatus!==UserApprovalStatus.APPROVED){
  // }
  if (user == null) {
    return await generateAPIError(errorMessages.userNotFound, 404);
  }
  if (user?.status === UserStatus.INACTIVE) {
    return await generateAPIError(errorMessages.userAccountBlocked, 404); // changed from 401 to 404 to fix frontend issue with redirect to login page
  }
  // if (user?.role !== UserRole.USER) {
  //   return await generateAPIError(errorMessages.unauthorized, 401);
  // }
  const comparePassword = await bcrypt.compare(password, user.password ?? "");
  if (!comparePassword) {
    return await generateAPIError(errorMessages.invalidCredentials, 404); // changed from 401 to 404 to fix frontend issue with redirect to login page
  }
  const postCount = await Post.countDocuments({
    createdBy: new ObjectId(user?._id),
  });
  return {
    _id: user?._id,
    firstName: user?.firstName,
    lastName: user?.lastName,
    userName: user?.userName,
    email: user?.email,
    role: user?.role,
    status: user?.status,
    coverImage: user?.coverImage,
    phoneNumber: user?.phoneNumber,
    profileImage: user?.profileImage,
    followers: user?.followers?.length ?? 0,
    followings: user?.followings?.length ?? 0,
    posts: postCount ?? 0,
    token: await generateToken({
      id: String(user?._id),
    }),
  };
};
const adminSignIn = async (userData) => {
  const { email, password, role } = userData;
  const user = await User.findOne({
    email,
    role: role ?? UserRole.ADMIN,
    isDeleted: false,
  });
  if (user == null) {
    return await generateAPIError(errorMessages.userNotFound, 404);
  }
  if (user?.status !== UserStatus.ACTIVE) {
    return await generateAPIError(errorMessages.userAccountBlocked, 401);
  }
  if (user?.role !== UserRole.ADMIN) {
    return await generateAPIError(errorMessages.unauthorized, 401);
  }
  const comparePassword = await bcrypt.compare(password, user.password ?? "");
  if (!comparePassword) {
    return await generateAPIError(errorMessages.invalidCredentials, 401);
  }
  const postCount = await Post.countDocuments({
    createdBy: new ObjectId(user?._id),
  });
  return {
    token: await generateToken({ id: user?._id }),
    ...{
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      role: user?.role,
      status: user?.status,
      phoneNumber: user?.phoneNumber,
      followers: user?.followers?.length ?? 0,
      followings: user?.followings?.length ?? 0,
      posts: postCount ?? 0,
    },
  };
};
const updateUser = async (userId, userData) => {
  const user = await User.findOne({
    _id: new ObjectId(userId),
    isDeleted: false,
  });
  if (user == null) {
    return await generateAPIError(errorMessages.userNotFound, 404);
  }
  const {
    // password,
    firstName,
    lastName,
    userName,
    phoneNumber,
    profileImage,
    coverImage,
    savedPost,
    // follower,
    // followerAuthor,
    following,
    password,
    newPassword,
  } = userData;
  let followings;
  let savedPosts;
  let followers;
  let hashedPassword;
  if (following != null) {
    const followUser = await User.findOne({
      _id: new ObjectId(following),
      isDeleted: false,
    });
    if (followUser == null) {
      return await generateAPIError(errorMessages.userNotFound, 404);
    }
    if (followUser?.followers?.includes(userId)) {
      followers = {
        $pull: { followers: userId },
      };
      followings = {
        $pull: { followings: following },
      };
    } else {
      followers = {
        $push: { followers: userId },
      };
      followings = {
        $push: { followings: following },
      };
    }
  }
  // if (follower != null) {
  //   if (user?.followers?.includes(String(follower))) {
  //     followers = {
  //       $pull: { followers: follower },
  //     };
  //     followings = {
  //       $pull: { followings: userId },
  //     };
  //   } else {
  //     followers = {
  //       $push: { followers: follower },
  //     };
  //     followings = {
  //       $push: { followings: userId },
  //     };
  //   }
  // }
  if (password != null && newPassword != null) {
    const comparePassword = await bcrypt.compare(password, user.password ?? "");
    if (!comparePassword) {
      return await generateAPIError(errorMessages.passwordNotMatch, 400);
    }
    hashedPassword = await hashValue(newPassword, 10);
  }
  if (savedPost != null) {
    if (user?.savedPosts?.includes(String(savedPost))) {
      savedPosts = {
        $pull: { savedPosts: savedPost },
      };
    } else {
      savedPosts = {
        $push: { savedPosts: savedPost },
      };
    }
  }
  await User.findOneAndUpdate(
    { _id: new ObjectId(following) },
    {
      ...(following != null && {
        ...followers,
      }),
    },
  );
  const data = await User.findOneAndUpdate(
    {
      _id: new ObjectId(userId),
      isDeleted: false,
    },
    {
      ...(firstName != null && {
        firstName,
      }),
      ...(lastName != null && {
        lastName,
      }),
      ...(userName != null && {
        userName,
      }),
      ...(phoneNumber != null && {
        phoneNumber,
      }),
      ...(profileImage != null && {
        profileImage,
      }),
      ...(coverImage != null && {
        coverImage,
      }),
      ...(following != null && {
        ...followings,
      }),
      // ...(follower != null && {
      //   ...followers,
      // }),
      ...(savedPost != null && {
        ...savedPosts,
      }),
      ...(password != null &&
        newPassword != null && {
          password: hashedPassword,
        }),
    },
    { new: true },
  )
    .populate({
      path: "followers",
      select: "firstName profileImage lastName",
    })
    .populate({
      path: "followings",
      select: "firstName profileImage lastName",
    });
  const postCount = await Post.countDocuments({
    createdBy: new ObjectId(user?._id),
  });
  return {
    // token: await generateToken({ id: user?._id }),
    // ...{
    firstName: data?.firstName,
    lastName: data?.lastName,
    email: data?.email,
    role: data?.role,
    status: data?.status,
    phoneNumber: data?.phoneNumber,
    followers: data?.followers,
    followings: data?.followings,
    posts: postCount ?? 0,
    profileImage: data?.profileImage,
    coverImage: data?.coverImage,
    userName: data?.userName,
    // },
  };
};
const forgotPassword = async ({ email, role }) => {
  const user = await User.findOne({ email, role, isDeleted: false });
  if (user == null) {
    return await generateAPIError(errorMessages.userNotFound, 400);
  }
  if (user?.status !== UserStatus.ACTIVE) {
    return await generateAPIError(errorMessages.userAccountBlocked, 401);
  }
  const uuId = getUuid();
  await User.findOneAndUpdate(user?._id, {
    resetId: uuId,
  });
  const obj = {
    to: user?.email,
    text: await resetLinkEmailTemplate({
      username: user?.userName ?? "",
      uuId,
    }),
    subject: "k-kuttan",
  };
  const sendMail = await sendEmail(obj);
  if (!sendMail) {
    // await User.deleteOne({ email })
    return await generateAPIError(errorMessages.emailSendFailed, 400);
  }
  return {
    message: successMessages.linkSend,
  };
};
const updatePassword = async ({ resetId, password }) => {
  if (resetId != null) {
    const user = await User.findOne({ resetId, isDeleted: false });
    if (user == null) {
      return await generateAPIError(errorMessages.linkExpired, 400);
    }
    const hashedPassword = await hashValue(password, 10);
    await User.findByIdAndUpdate(user?._id, {
      password: hashedPassword,
      resetId: "",
    });
    return {
      message: "password reset successfully ",
    };
  }
};
const updateUserByAdmin = async (userId) => {
  return await User.findOneAndUpdate(
    {
      _id: new ObjectId(userId),
      isDeleted: false,
      role: { $ne: UserRole.ADMIN },
    },
    { new: true },
  ).populate("-password");
};
const findUserById = async ({
  userId,
  isFollowers,
  isFollowing,
  isProfile = false,
}) => {
  // console.log(userId, "userIddd");
  const userData = await User.findOne({
    _id: new ObjectId(userId),
    isDeleted: false,
  })
    .populate([
      ...(isFollowers
        ? [
            {
              path: "followers",
              select: "firstName profileImage lastName",
            },
          ]
        : []),
      ...(isFollowing
        ? [
            {
              path: "followings",
              select: "firstName profileImage lastName",
            },
          ]
        : []),
    ])
    .select("-password"); // Uncomment if needed to exclude the password field
  const postCount = await Post.countDocuments({
    createdBy: new ObjectId(userId),
    isDeleted: false,
    ...(!isProfile && {
      approvalStatus: UserApprovalStatus.APPROVED,
      isDraft: false,
    }),
  });
  const data = userData;
  data.postCount = postCount;
  console.log(data, "datasssss", postCount);
  return data;
};
const getAllUsers = async ({ query, options, userId }) => {
  // const data = await User.find(query, {}, options)
  // const data = await User.find(
  //   query,
  //   'firstName lastName profileImage _id userName role followers',
  //   options,
  // )
  // const totalCount = await User.countDocuments(query)
  const data = await User.aggregate([
    { $match: query },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        profileImage: 1,
        _id: 1,
        userName: 1,
        role: 1,
        followers: 1,
        isFollowing: { $in: [userId, "$followers"] },
      },
    },
    {
      $sort: options?.sort,
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: options?.skip ?? 0 }, { $limit: options?.limit ?? 10 }],
      },
    },
  ]);
  return {
    data: data[0]?.data,
    totalCount: data[0]?.metadata[0]?.total || 0,
  };
};
const findAvailableUsersForChat = async ({ query, filterQuery }) => {
  const data = await User.aggregate([
    // Match the user by _id
    {
      $match: query,
    },
    // Project the fields to merge followers and followings
    {
      $project: {
        commonArray: {
          $setUnion: ["$followers", "$followings"],
        },
      },
    },
    // Lookup user data for these userIds
    {
      $lookup: {
        from: "users",
        localField: "commonArray",
        foreignField: "_id",
        as: "userData",
        pipeline: [
          {
            $match: filterQuery,
          },
          {
            $project: {
              profileImage: 1,
              firstName: 1,
              lastName: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    // Project to format the result as desired
    {
      $project: {
        _id: 0,
        userData: 1,
      },
    },
  ]);
  console.log(data);
  return data[0]?.userData;
};
export const userService = {
  userSignUp,
  userSignIn,
  adminSignIn,
  updateUser,
  forgotPassword,
  updatePassword,
  updateUserByAdmin,
  findUserById,
  getAllUsers,
  findAvailableUsersForChat,
};
