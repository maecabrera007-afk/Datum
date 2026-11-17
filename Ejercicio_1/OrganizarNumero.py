def ordenar_tres_numeros(a, b, c):

    if a > b:
        a, b = b, a
    if b > c:
        b, c = c, b
    if a > b:
        a, b = b, a
        
    return a, b, c

while True:
    entrada = input("Ingresa 3 números separados por un espacio (ej. 45 12 8): ")
    partes = entrada.split() 

    if len(partes) != 3:
        print(f"Error: Ingresaste {len(partes)} dato(s). Deben ser exactamente 3.\n")
        continue

    try:
        n1, n2, n3 = map(int, partes)
        break 
    except ValueError:
        print("Error: Asegúrate de ingresar únicamente números válidos.\n")

menor, medio, mayor = ordenar_tres_numeros(n1, n2, n3)
print("Ordenados:", menor, medio, mayor)