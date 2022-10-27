# convert poseidon constants from circom to python

generated_file_path = 'poseidon_constants.py'
constants_file_path = '../circomlib/circuits/poseidon_constants.circom'

open(generated_file_path, 'a').close()
with (
    open(constants_file_path) as circom,
    open(generated_file_path, 'w') as py
):
    remove_brackets = 0
    for line in circom:
        remove_now = True

        sline = line.strip()
        if sline.startswith('//') or sline.startswith('pragma'):
            continue

        if sline == 'return':
            line = line.replace('return', 'return [')
            remove_brackets += 1
            remove_now = False
            
        line = line.replace(
            'function', 'def'
        ).replace(
            ') {', '):'
        ).replace(
            '{', ''
        ).replace(
            '}', ''
        ).replace(
            'else if', 'elif'
        ).replace(
            ';', ''
        ).replace(
            ' elif', 'elif'
        ).replace(
            ' else', 'else:'
        )

        if remove_brackets == 1 and remove_now:
            line = line.replace('[', '')
            remove_brackets -= 1

        py.writelines([line])
