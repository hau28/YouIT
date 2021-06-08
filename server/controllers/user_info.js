import express from "express";
import mongoose from "mongoose";
import { sendNotificationUser } from "../businessLogics/notification.js";
import User from "../models/user.js";
import FriendRequest from "../models/friendrequest.js";
import { httpStatusCodes } from "../utils/httpStatusCode.js";
import { getRelationship } from "../businessLogics/user.js";

// GET userinfo/:id
export const getUserInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const currentUser = await User.findById(id);
    res.status(200).json(currentUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT userinfo/:id
export const updateUserInfo = async (req, res) => {
  const { userId } = req;
  if (!userId) {
    return res.json({ message: "Unauthenticated" });
  }

  try {
    const updatedUser = req.body;
    //const { userInfo } = updatedUser;
    if (!updatedUser)
      return res.status(400).send(`New user information is required`);

    await User.findByIdAndUpdate(userId, updatedUser);

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// use for updating receiver
export const addReceivingFriendRequest = async (req, res) => {
  const friendRequest = req.body;
  //console.log(friendRequest);
  try {
    // update receiver
    await User.findById(friendRequest.userConfirmId).then(async (user) => {
      if (!user.listReceivingFriendRequests.includes(friendRequest._id)) {
        user.listReceivingFriendRequests.push(friendRequest._id);
        await user.save();
        res.status(httpStatusCodes.ok).json(user);
      } else {
        res.json({ message: "Friend request exists" });
      }
    });
  } catch (error) {
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};

export const removeReceivingFriendRequest = async (req, res) => {
  const friendRequest = req.body;
  //console.log(friendRequest);
  try {
    // update receiver
    await User.findById(friendRequest.userConfirmId).then(async (user) => {
      user.listReceivingFriendRequests =
        user.listReceivingFriendRequests.filter(
          (item) => item != friendRequest._id
        );
      await user.save();
      res.status(httpStatusCodes.ok).json(user);
    });
  } catch (error) {
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};

// use for updating sender
export const addSendingFriendRequest = async (req, res) => {
  const friendRequest = req.body;

  try {
    // update sender
    await User.findById(friendRequest.userSendRequestId).then(async (user) => {
      if (!user.listSendingFriendRequests.includes(friendRequest._id)) {
        user.listSendingFriendRequests.push(friendRequest._id);
        await user.save();
        res.status(httpStatusCodes.ok).json(user);
      } else {
        res.json({ message: "Friend request exists" });
      }
    });
  } catch (error) {
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};

export const removeSendingFriendRequest = async (req, res) => {
  const friendRequest = req.body;
  try {
    // update receiver
    await User.findById(friendRequest.userSendRequestId).then(async (user) => {
      user.listSendingFriendRequests = user.listSendingFriendRequests.filter(
        // item is object
        // friendRequest._id is string
        // type different => can't use !==
        (item) => item != friendRequest._id
      );
      await user.save();
      res.status(httpStatusCodes.ok).json(user);
    });
  } catch (error) {
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};

// PUT userinfo/:id/addfriend
/**
 * @param {express.Request<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>} req
 * @param {express.Response<any, Record<string, any>, number>} res
 * @param {express.NextFunction} next
 */
export const addFriend = async (req, res) => {
  const friendRequest = req.body;
  const { userId } = req;
  console.log(friendRequest);
  // dang bi loi 500 ko biet o dau
  if (!userId)
    return res
      .status(httpStatusCodes.unauthorized)
      .json({ message: "Unauthorized" });

  if (!(await FriendRequest.findById(friendRequest?._id)))
    return res
      .status(httpStatusCodes.notFound)
      .json({ message: "Request not found" });

  try {
    console.log("rela");
    const relationship = getRelationship(
      friendRequest?.userConfirmId,
      friendRequest?.userSendRequestId
    );
    if (relationship.equals("Friend"))
      return res
        .status(httpStatusCodes.badContent)
        .json({ message: "Have already been friend" });

    // add friendId to user's list friends
    const acceptingUser = await User.findById(userId);
    acceptingUser.listFriends.push(friendRequest?.userSendRequestId);
    await acceptingUser.save();

    // add userId to friend's list friends
    const acceptedUser = await User.findById(friendRequest?.userSendRequestId);

    if (!acceptedUser)
      return res
        .status(httpStatusCodes.notFound)
        .send("User sending friend request is not found");

    acceptedUser.listFriends.push(userId);
    await acceptedUser.save();

    // notification
    sendNotificationUser({
      userId: friendRequest?.userSendRequestId,
      content: {
        acceptingUserId: userId,
        acceptedUserId: friendRequest?.userSendRequestId,
        description: `${acceptingUser.name} accepted your friend request!`,
      },
      link: `/userinfo/${acceptingUser._id}`,
      kind: "AcceptFriend_AcceptedFriend",
    });

    return res.status(httpStatusCodes.ok).json(acceptedUser);
  } catch (error) {
    console.log(error);
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};

/**
 * @param {express.Request<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>} req
 * @param {express.Response<any, Record<string, any>, number>} res
 * @param {express.NextFunction} next
 */
export const unfriend = async (req, res) => {
  const { friendId } = req.params;
  const { userId } = req;

  if (!userId)
    return res
      .status(httpStatusCodes.unauthorized)
      .json({ message: "Unauthorized" });

  try {
    // remove friend from user's list friends
    await User.findById(userId).then(async (user) => {
      user.listFriends = user.listFriends.filter((id) => id != friendId);
      await user.save();
    });

    // remove user from friend's list friends
    await User.findById(friendId).then(async (friend) => {
      friend.listFriends = friend.listFriends.filter((id) => id != userId);
      await friend.save();
      res.status(httpStatusCodes.ok).json(friend);
    });
  } catch (error) {
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};

/**
 * @param {express.Request<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>} req
 * @param {express.Response<any, Record<string, any>, number>} res
 * @param {express.NextFunction} next
 */
export const followUser = async (req, res) => {
  const { followedId } = req.params;
  const { userId } = req;

  if (!userId)
    return res
      .status(httpStatusCodes.unauthorized)
      .json({ message: "Unauthorized" });

  try {
    await User.findById(followedId)
      .then(async (user) => {
        if (user.listFriendFollows.includes(userId))
          return res
            .status(httpStatusCodes.badContent)
            .json({ message: "Followed this user" });

        user.listFriendFollows.push(userId);
        await user.save();
        res.status(httpStatusCodes.ok).json(user);
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};

/**
 * @param {express.Request<ParamsDictionary, any, any, QueryString.ParsedQs, Record<string, any>>} req
 * @param {express.Response<any, Record<string, any>, number>} res
 * @param {express.NextFunction} next
 */
export const unfollowUser = async (req, res) => {
  const { followedId } = req.params;
  const { userId } = req;
  // dang lam
  if (!userId)
    return res
      .status(httpStatusCodes.unauthorized)
      .json({ message: "Unauthorized" });

  try {
    await User.findById(followedId)
      .then(async (user) => {
        if (user.listFriendFollows.includes(userId)) {
          user.listFriendFollows = user.listFriendFollows.filter(
            (followingId) => followingId != userId
          );
          await user.save();
          res.status(httpStatusCodes.ok).json(user);
        } else {
          res
            .status(httpStatusCodes.notFound)
            .json("You have not followed this user");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
    res
      .status(httpStatusCodes.internalServerError)
      .json({ message: error.message });
  }
};
