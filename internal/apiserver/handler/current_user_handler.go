// Copyright The MatrixHub Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package handler

import (
	"context"
	"strconv"
	"time"

	"github.com/samber/lo"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/matrixhub-ai/matrixhub/api/go/v1alpha1"
	"github.com/matrixhub-ai/matrixhub/internal/domain/user"
	"github.com/matrixhub-ai/matrixhub/internal/infra/log"
)

type CurrentUserHandler struct {
	userRepo        user.IUserRepo
	accessTokenRepo user.IAccessTokenRepo
}

func (cu *CurrentUserHandler) GetCurrentUser(ctx context.Context, request *v1alpha1.GetCurrentUserRequest) (*v1alpha1.GetCurrentUserResponse, error) {
	user, err := cu.userRepo.GetUser(ctx, user.GetCurrentUserId(ctx))
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "user not found")
	}
	return &v1alpha1.GetCurrentUserResponse{
		Id:       uint32(user.ID),
		Username: user.Username,
		IsAdmin:  false,
	}, nil
}

func (cu *CurrentUserHandler) ResetPassword(ctx context.Context, request *v1alpha1.ResetPasswordRequest) (*v1alpha1.ResetPasswordResponse, error) {
	user, err := cu.userRepo.GetUser(ctx, user.GetCurrentUserId(ctx))
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "user not found")
	}
	if !user.CheckPassword(request.OldPassword) {
		return nil, status.Error(codes.InvalidArgument, "old password is incorrect")
	}
	if user.CheckPassword(request.NewPassword) {
		return nil, status.Error(codes.InvalidArgument, "new password is same as old password")
	}

	if err = cu.userRepo.UpdateUserPassword(ctx, user.ID, request.NewPassword); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}
	return &v1alpha1.ResetPasswordResponse{}, nil
}

func (cu *CurrentUserHandler) ListAccessTokens(ctx context.Context, request *v1alpha1.ListAccessTokensRequest) (*v1alpha1.ListAccessTokensResponse, error) {
	aks, err := cu.accessTokenRepo.ListUserAccessTokens(ctx, user.GetCurrentUserId(ctx))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &v1alpha1.ListAccessTokensResponse{
		Items: lo.Map(aks, func(item *user.AccessToken, _ int) *v1alpha1.AccessToken {
			expiredAt := ""
			if item.ExpiredAt != nil {
				expiredAt = strconv.Itoa(int(item.ExpiredAt.Unix()))
			}
			status := v1alpha1.AccessTokenStatus_ACCESS_TOKEN_STATUS_UNKNOWN
			if item.ExpiredAt == nil || item.ExpiredAt.After(time.Now()) {
				status = v1alpha1.AccessTokenStatus_ACCESS_TOKEN_STATUS_VALID
			} else if time.Now().After(*item.ExpiredAt) {
				status = v1alpha1.AccessTokenStatus_ACCESS_TOKEN_STATUS_EXPIRED
			}
			return &v1alpha1.AccessToken{
				Id:        item.Id,
				Name:      item.Name,
				Status:    status,
				CreatedAt: strconv.Itoa(int(item.CreatedAt.Unix())),
				ExpiredAt: expiredAt,
			}
		}),
	}, nil

}

func (cu *CurrentUserHandler) CreateAccessToken(ctx context.Context, request *v1alpha1.CreateAccessTokenRequest) (*v1alpha1.CreateAccessTokenResponse, error) {
	if err := request.ValidateAll(); err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	var expireAt *time.Time
	if request.GetExpiredAt() != "" {
		expire, err := strconv.Atoi(request.GetExpiredAt())
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, err.Error())
		}
		expTime := time.Unix(int64(expire), 0)
		expireAt = &expTime
	}

	ak := user.AccessToken{
		Name:      request.GetName(),
		UserId:    user.GetCurrentUserId(ctx),
		Enabled:   true,
		ExpiredAt: expireAt,
	}
	if err := cu.accessTokenRepo.CreateAccessToken(ctx, ak); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &v1alpha1.CreateAccessTokenResponse{}, nil
}

func (cu *CurrentUserHandler) DeleteAccessToken(ctx context.Context, request *v1alpha1.DeleteAccessTokenRequest) (*v1alpha1.DeleteAccessTokenResponse, error) {
	if err := request.ValidateAll(); err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	if err := cu.accessTokenRepo.DeleteAccessToken(ctx, user.GetCurrentUserId(ctx), request.GetId()); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &v1alpha1.DeleteAccessTokenResponse{}, nil
}

func (cu *CurrentUserHandler) GetProjectRoles(ctx context.Context, request *v1alpha1.GetProjectRolesRequest) (*v1alpha1.GetProjectRolesResponse, error) {
	// TODO implement me
	panic("implement me")
}

func (cu *CurrentUserHandler) RegisterToServer(options *ServerOptions) {
	// Register GRPC Handler
	v1alpha1.RegisterCurrentUserServer(options.GRPCServer, cu)
	if err := v1alpha1.RegisterCurrentUserHandlerFromEndpoint(context.Background(), options.GatewayMux, options.GRPCAddr, options.GRPCDialOpt); err != nil {
		log.Errorf("register handler error: %s", err.Error())
	}
}

func NewCurrentUserHandler(repo user.IUserRepo) IHandler {
	handler := &CurrentUserHandler{
		userRepo: repo,
	}

	return handler
}
