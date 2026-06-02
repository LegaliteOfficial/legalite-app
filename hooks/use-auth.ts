"use client"
import { LoginMutationDoc, RegisterOwnerMutationDoc } from "@/lib/graphql/mutations/auth"
import { useMutation } from "@apollo/client/react"


export const useRegisterUser = () => {
    const [registerMutaion, { loading, error }] = useMutation(RegisterOwnerMutationDoc)
}

export const useLoginUser = () => {
    const [loginMutation, { loading, error }] = useMutation(LoginMutationDoc)
}