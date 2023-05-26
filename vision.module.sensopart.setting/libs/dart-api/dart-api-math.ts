import { FourNumArray } from "./dart-api";

/**
 * 3D coordinate system notation
 *
 * @enum
 * @api-version 1
 * @user
 */
export const CoordinateNotationType = {
    /**
     * Orientation is RotZ*RotY*RotZ
     *
     * @api-version 1
     * @user
     */
    ZYZ: 0,
    /**
     * Orientation is RotZ*RotY*RotX
     *
     * @api-version 1
     * @user
     */
    ZYX: 1,
}  as const;
/**
 * @ignore
 */
export type CoordinateNotationType = typeof CoordinateNotationType[keyof typeof CoordinateNotationType];

/**
 * 3D Vector
 *
 * @enum
 * @api-version 1
 * @user
 */
export interface Vector3D {
    /**
     * X value
     *
     * @enum
     * @api-version 1
     * @user
     */
    x: number,
    /**
     * Y value
     *
     * @enum
     * @api-version 1
     * @user
     */
    y: number,
    /**
     * Z value
     *
     * @enum
     * @api-version 1
     * @user
     */
    z: number
}

/**
 * 3D angular value.
 * The meaning of the values of a, b, and c is different depending on the notation.
 *
 * @enum
 * @api-version 1
 * @user
 */
export interface EulerAngle {
    /**
     * First rotation element (degree)
     *
     * @enum
     * @api-version 1
     * @user
     */
    a: number,
    /**
     * Second rotation element (degree)
     *
     * @enum
     * @api-version 1
     * @user
     */
    b: number,
    /**
     * Third rotation element (degree)
     *
     * @enum
     * @api-version 1
     * @user
     */
    c:number,
    /**
     * Coordinate system notation
     *
     * @enum
     * @api-version 1
     * @user
     */
    type: CoordinateNotationType
}

/**
 * 3D coordinate system structure
 *
 * @enum
 * @api-version 1
 * @user
 */
export interface Coordinate {
    /**
     * Position element.
     *
     * @enum
     * @api-version 1
     * @user
     */
    position: Vector3D,
    /**
     * Rotation element
     *
     * @enum
     * @api-version 1
     * @user
     */
    rotation: EulerAngle
}

/**
 * 3D homogeneous matrix structure
 *
 * @enum
 * @api-version 1
 * @user
 */
export type MatrixH3D = [FourNumArray, FourNumArray, FourNumArray, FourNumArray];



/**
 * IMathLibrary have a math-related API.
 *
 * @api-version 1
 * @user
 */
export interface IMathLibrary {

    /**
     * Calculate the cross product of two vectors.
     *
     * @param vector1 First vector
     * @param vector2 Second vector
     * @return Result vector of cross product
     *
     * @api-verion 1
     * @user
     */
    crossProduct(vector1: Vector3D, vector2: Vector3D): Vector3D

    /**
     * Calculate the dot product of two vectors.
     *
     * @param vector1 First vector
     * @param vector2 Second vector
     * @return Result scalar of dot product
     *
     * @api-verion 1
     * @user
     */
    dotProduct(vector1: Vector3D, vector2: Vector3D): number

    /**
     * Caculate the square of a vector's magnitude.
     *
     * @param vector Vector
     * @return Vector magnitude squared
     *
     * @api-verion 1
     * @user
     */
    magnitudeSQ(vector: Vector3D): number

    /**
     * Calculate the magnitude of the vector.
     *
     * @param vector Vector
     * @return Vector magnitude
     *
     * @api-verion 1
     * @user
     */
    magnitude(vector: Vector3D): number

    /**
     * Determines whether the magnitude of the vector is 0.
     *
     * @param vector Vector
     * @return boolean
     *
     * @api-verion 1
     * @user
     */
    isVectorZero(vector: Vector3D): boolean

    /**
     * Calculate the unit vector.
     *
     * @param vector1 Vector
     * @return Unit vector
     *
     * @api-verion 1
     * @user
     */
    unitVector(vector1: Vector3D): Vector3D

    /**
     * Calculates a matrix in which each axis direction of the input matrix is corrected to be perpendicular to each other.
     *
     * @param hMat 3D Pose Matrix
     * @return A matrix in which each axis is perpendicular to each other
     *
     * @api-verion 1
     * @user
     */
    makeValidMatrix(hMat: MatrixH3D): MatrixH3D

    /**
     * Calculate the three-dimensional pose matrix with the pose denoted by Euler.
     *
     * @param pose Pose values defined in zyz notation.
     * @return A three-dimensional pose matrix
     *
     * @api-verion 1
     * @user
     */
    eulerToMatrix(pose: Coordinate): MatrixH3D | null

    /**
     * Calculate the three-dimensional pose matrix with the pose denoted by Euler ZYZ.
     *
     * @param pose Pose values defined in zyz notation.
     * @return A three-dimensional pose matrix
     *
     * @api-verion 1
     * @user
     */
    eulerZYZToMatrix(pose: Coordinate): MatrixH3D | null

    /**
     * Calculate the three-dimensional pose matrix with the pose denoted by Euler ZYX.
     *
     * @param pose Pose values defined in zyx notation.
     * @return A three-dimensional pose matrix
     *
     * @api-verion 1
     * @user
     */
    eulerZYXToMatrix(pose: Coordinate): MatrixH3D | null

    /**
     * Calculate the pose denoted by Euler ZYZ with the three-dimensional pose matrix
     *
     * @param hMat pose A three-dimensional pose matrix
     * @param flip
     * @return Pose values defined in zyz notation.
     *
     * @api-verion 1
     * @user
     */
    matrixToEulerZYZ(hMat: MatrixH3D, flip?: boolean): Coordinate | null

    /**
     * Calculate the pose denoted by Euler ZYX with the three-dimensional pose matrix
     *
     * @param hMat pose A three-dimensional pose matrix
     * @param flip
     * @return Pose values defined in zyx notation.
     *
     * @api-verion 1
     * @user
     */
    matrixToEulerZYX(hMat: MatrixH3D, flip?: boolean): Coordinate | null

    /**
     * Perform coordinate system multiplication on euler values. (eulerA * eulerB)
     *
     * @param eulerA First Value
     * @param eulerB Second value
     * @return Calculated value of coordinate multiplication.
     *
     * @api-verion 1
     * @user
     */
     eulerMul(eulerA: Coordinate, eulerB: Coordinate, ref: CoordinateNotationType): Coordinate

    /**
     * matrix multiplication (mat_a * mat_b)
     *
     * @param matA First Matrix
     * @param matB Second Matrix
     * @return Calculated value of matrix multiplication.
     *
     * @api-verion 1
     * @user
     */
    matMul(matA: MatrixH3D, matB: MatrixH3D): MatrixH3D

    /**
     * Calculate the inverse euler values
     *
     * @param euler A three-dimensional euler values
     * @return Inverse value
     *
     * @api-verion 1
     * @user
     */
     inverseEuler(euler: Coordinate): Coordinate

    /**
     * Calculate the inverse matrix
     *
     * @param hMat A three-dimensional pose matrix
     * @return Inverse matrix
     *
     * @api-verion 1
     * @user
     */
    inverse(hMat: MatrixH3D): MatrixH3D

    /**
     * Calculate the angle between two vectors.
     *
     * @param vector1 First vector
     * @param vector2 Second vector
     * @return The angle between two vectors
     *
     * @api-verion 1
     * @user
     */
    calculateDegreeAngleBetweenTwoVector(vector1: Vector3D, vector2: Vector3D): number

    /**
     * Define a three-dimensional pose matrix using three points.
     *
     * @param origin origin
     * @param pointAlongX A point on the x-axis
     * @param pointOnXyPlane A point on the xy plane.
     * @return A three-dimensional pose matrix
     *
     * @api-verion 1
     * @user
     */
    calculateMatrixUsingThreePoints(origin: Vector3D, pointAlongX: Vector3D, pointOnXyPlane: Vector3D): MatrixH3D | null
}
