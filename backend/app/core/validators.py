from fastapi import HTTPException, status


def normalize_cpf(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


def validate_cpf(value: str) -> str:
    cpf = normalize_cpf(value)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF invalido")

    for digit_index in (9, 10):
        total = sum(int(cpf[num]) * ((digit_index + 1) - num) for num in range(digit_index))
        verifier = (total * 10) % 11
        verifier = 0 if verifier == 10 else verifier
        if verifier != int(cpf[digit_index]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF invalido")
    return cpf
